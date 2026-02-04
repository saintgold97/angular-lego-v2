CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    notes text NOT NULL,
    
    activity_type text DEFAULT 'update' CHECK (
        activity_type IN ('update', 'milestone', 'issue', 'meeting', 'task')
    ),
    priority text DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'critical')
    ),
    
    activity_date date DEFAULT CURRENT_DATE,
    working_hours numeric(5,2) DEFAULT 0 CHECK (working_hours >= 0)
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select activities policy" ON public.activities
FOR SELECT TO authenticated
USING (
    auth.uid() = created_by 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Insert activities policy" ON public.activities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Delete activities policy" ON public.activities
FOR DELETE TO authenticated
USING (auth.uid() = created_by);