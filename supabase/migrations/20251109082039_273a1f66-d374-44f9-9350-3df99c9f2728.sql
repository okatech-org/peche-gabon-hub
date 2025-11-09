-- Create table for feedback/remontées from demo accounts
CREATE TABLE public.demo_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_demo TEXT NOT NULL,
  type_feedback TEXT NOT NULL, -- 'role', 'mission', 'besoin', 'amelioration'
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT DEFAULT 'nouveau', -- 'nouveau', 'en_cours', 'traite', 'archive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_feedbacks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.demo_feedbacks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.demo_feedbacks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.demo_feedbacks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can update feedback status
CREATE POLICY "Admins can update feedback"
ON public.demo_feedbacks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_demo_feedbacks_updated_at
BEFORE UPDATE ON public.demo_feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();