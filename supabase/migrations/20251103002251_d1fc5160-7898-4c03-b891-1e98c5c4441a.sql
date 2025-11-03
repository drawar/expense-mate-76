-- Assign admin role to the initial admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;