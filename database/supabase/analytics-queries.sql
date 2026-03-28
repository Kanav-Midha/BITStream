select * from public.analytics_user_watch_summary order by total_watch_seconds desc;

select * from public.analytics_content_popularity order by unique_viewers desc, total_watch_seconds desc;

select
  media_category,
  sum(watch_seconds) as total_watch_seconds
from public.media_watch_events
where user_email = 'student@goa.bits-pilani.ac.in'
group by media_category
order by total_watch_seconds desc;
