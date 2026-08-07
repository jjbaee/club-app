-- ==========================================================
-- 동아리 웹앱 DB 스키마
-- Supabase 대시보드 → SQL Editor → 새 쿼리에 붙여넣고 실행하세요.
-- ==========================================================

-- 1. 회원 프로필 테이블 (auth.users와 1:1 연결)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '이름없음',
  avatar_url text,
  role text not null default 'member', -- 'member' | 'admin'
  created_at timestamptz not null default now()
);

-- 회원가입 시 자동으로 profiles row 생성하는 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. 게시판 (공지/자유글)
create table if not exists posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  is_notice boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. 캘린더 (동아리 일정)
create table if not exists events (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. 자료실 (파일 메타데이터, 실제 파일은 Storage에 저장)
create table if not exists files (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  file_path text not null, -- storage 안의 경로
  file_name text not null,
  uploader_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. 채팅방 (라이트 채팅)
create table if not exists messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ==========================================================
-- RLS (Row Level Security) 활성화
-- ==========================================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table events enable row level security;
alter table files enable row level security;
alter table messages enable row level security;

-- profiles: 로그인한 사람은 전체 목록 조회 가능, 본인 정보만 수정 가능
create policy "profiles_select_all" on profiles for select to authenticated using (true);
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id);
-- 관리자는 다른 회원의 프로필(등급 등)도 수정 가능
create policy "profiles_update_admin" on profiles for update to authenticated using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- posts: 로그인한 사람은 조회/작성 가능, 본인 글이거나 관리자만 수정/삭제
create policy "posts_select_all" on posts for select to authenticated using (true);
create policy "posts_insert_own" on posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts_update_own_or_admin" on posts for update to authenticated using (
  auth.uid() = author_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "posts_delete_own_or_admin" on posts for delete to authenticated using (
  auth.uid() = author_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- events: 로그인한 사람은 조회/작성 가능, 본인이 만들었거나 관리자만 수정/삭제
create policy "events_select_all" on events for select to authenticated using (true);
create policy "events_insert_all" on events for insert to authenticated with check (auth.uid() = created_by);
create policy "events_update_own_or_admin" on events for update to authenticated using (
  auth.uid() = created_by or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "events_delete_own_or_admin" on events for delete to authenticated using (
  auth.uid() = created_by or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- files: 로그인한 사람은 조회/업로드 가능, 본인이 올린 파일이거나 관리자만 삭제
create policy "files_select_all" on files for select to authenticated using (true);
create policy "files_insert_all" on files for insert to authenticated with check (auth.uid() = uploader_id);
create policy "files_delete_own_or_admin" on files for delete to authenticated using (
  auth.uid() = uploader_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- messages: 로그인한 사람은 조회/작성 가능 (본인 이름으로만)
create policy "messages_select_all" on messages for select to authenticated using (true);
create policy "messages_insert_own" on messages for insert to authenticated with check (auth.uid() = sender_id);

-- ==========================================================
-- Storage 버킷 생성 (자료실 파일 업로드용)
-- ==========================================================
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do nothing;

create policy "files_bucket_select" on storage.objects for select to authenticated using (bucket_id = 'files');
create policy "files_bucket_insert" on storage.objects for insert to authenticated with check (bucket_id = 'files');
create policy "files_bucket_delete" on storage.objects for delete to authenticated using (bucket_id = 'files');

-- ==========================================================
-- Realtime 활성화 (채팅방 실시간 갱신용)
-- ==========================================================
alter publication supabase_realtime add table messages;
