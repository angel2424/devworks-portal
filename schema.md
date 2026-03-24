create table public.catalog_status (
  id uuid not null default gen_random_uuid (),
  category text not null,
  value text not null,
  label text not null,
  color text null,
  order_index integer not null default 0,
  is_default boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint catalog_status_pkey primary key (id),
  constraint unique_category_value unique (category, value)
) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  full_name text null,
  avatar_url text null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (role = any (array['team'::text, 'client'::text]))
  )
) TABLESPACE pg_default;

create table public.clients (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text null,
  phone text null,
  company text null,
  notes text null,
  assigned_to uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status_id uuid not null default get_default_status ('client'::text),
  constraint clients_pkey primary key (id),
  constraint clients_assigned_to_fkey foreign KEY (assigned_to) references profiles (id) on delete set null,
  constraint clients_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint clients_status_id_fkey foreign KEY (status_id) references catalog_status (id)
) TABLESPACE pg_default;

create trigger set_clients_updated_at BEFORE
update on clients for EACH row
execute FUNCTION set_updated_at ();

create table public.phases (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  name text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint phases_pkey primary key (id),
  constraint phases_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.projects (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  client_id uuid not null,
  status_id uuid not null default get_default_status ('project'::text),
  start_date date null,
  end_date date null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE,
  constraint projects_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint projects_status_id_fkey foreign KEY (status_id) references catalog_status (id)
) TABLESPACE pg_default;

create trigger set_projects_updated_at BEFORE
update on projects for EACH row
execute FUNCTION set_updated_at ();

create table public.tasks (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  phase_id uuid null,
  title text not null,
  description text null,
  status_id uuid not null default get_default_status ('task_status'::text),
  priority_id uuid not null default get_default_status ('priority'::text),
  assigned_to uuid null,
  due_date date null,
  order_index integer not null default 0,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tasks_pkey primary key (id),
  constraint tasks_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint tasks_phase_id_fkey foreign KEY (phase_id) references phases (id) on delete set null,
  constraint tasks_assigned_to_fkey foreign KEY (assigned_to) references profiles (id) on delete set null,
  constraint tasks_priority_id_fkey foreign KEY (priority_id) references catalog_status (id),
  constraint tasks_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint tasks_status_id_fkey foreign KEY (status_id) references catalog_status (id)
) TABLESPACE pg_default;

create trigger set_tasks_updated_at BEFORE
update on tasks for EACH row
execute FUNCTION set_updated_at ();

-- =============================================
-- Knowledge Base
-- =============================================

create table public.kb_folders (
  id         uuid not null default gen_random_uuid(),
  name       text not null,
  parent_id  uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint kb_folders_pkey primary key (id),
  constraint kb_folders_parent_fkey
    foreign key (parent_id) references kb_folders(id) on delete cascade,
  constraint kb_folders_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null
) TABLESPACE pg_default;

create trigger set_kb_folders_updated_at BEFORE
update on kb_folders for EACH row
execute FUNCTION set_updated_at ();

create table public.kb_articles (
  id         uuid not null default gen_random_uuid(),
  title      text not null,
  content    text null default '',
  folder_id  uuid null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint kb_articles_pkey primary key (id),
  constraint kb_articles_folder_fkey
    foreign key (folder_id) references kb_folders(id) on delete set null,
  constraint kb_articles_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null,
  constraint kb_articles_updated_by_fkey
    foreign key (updated_by) references profiles(id) on delete set null
) TABLESPACE pg_default;

create trigger set_kb_articles_updated_at BEFORE
update on kb_articles for EACH row
execute FUNCTION set_updated_at ();
