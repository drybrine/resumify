-- Run if DB already created with old 3 templates
alter table public.cvs drop constraint if exists cvs_template_check;
alter table public.cvs add constraint cvs_template_check check (
  template in (
    'jake', 'modern', 'compact',
    'elegant', 'sidebar', 'corporate', 'tech', 'minimal'
  )
);
