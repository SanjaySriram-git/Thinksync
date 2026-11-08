"use client";
import { createClient } from "@/lib/supabase/client";
import TSPageTransition from "@/components/TSPageTransition";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Upload,
  X,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
/* =========================================================
   DATA
========================================================= */

type UserSubject = {
  id: number;
  name: string;
  category: string;
  topics: string[];
  progress: number;
  created_at?: string;
};

const getSubjectTone = (index: number) => {
  const tones = ["cyan", "violet", "pink", "green"];
  return tones[index % tones.length];
};

const getSubjectShort = (subject: UserSubject) => {
  const source = subject.category.trim() || subject.name.trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 5)
      .toUpperCase();
  }

  return source.slice(0, 6).toUpperCase() || "SUBJ";
};


const quickActions = [
  {
    title: "Ask StudyBuddy",
    description: "Get an explanation for any topic.",
    icon: MessageSquare,
    tone: "cyan",
  },
  {
    title: "Generate Quiz",
    description: "Test yourself with AI questions.",
    icon: BrainCircuit,
    tone: "violet",
  },
  {
    title: "Study Plan",
    description: "Build a focused plan for today.",
    icon: CalendarDays,
    tone: "pink",
  },
  {
    title: "My Notes",
    description: "Review your saved study material.",
    icon: FileText,
    tone: "green",
  },
];

/* =========================================================
   TYPES
========================================================= */

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type Quiz = {
  topic: string;
  questions: QuizQuestion[];
};

type TimePlanItem = {
  id: number;
  subject: string;
  task: string;
  start: string;
  end: string;
  completed: boolean;
};

/*
 * Row shape of the `study_sessions` table.
 */
type StudySession = {
  id: number;
  subject: string;
  task: string;
  start_time: string;
  end_time: string;
  session_date: string;
  completed: boolean;
};

type Note = {
  id: number;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

/* =========================================================
   DATE / TIME HELPERS
========================================================= */

const DAILY_GOAL_MINUTES = 240;

// Postgres `time` comes back as "18:00:00" — <input type="time"> needs "18:00".
const toTimeInput = (value: string) => (value ?? "").slice(0, 5);

// Local-date key, e.g. "2026-09-17". Avoids the UTC shift of toISOString().
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;

const todayKey = () => toDateKey(new Date());

/* =========================================================
   PAGE
========================================================= */

export default function StudyPage() {
  const [introFinished, setIntroFinished] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  /* USER / SUBJECTS */
  const [userId, setUserId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCategory, setSubjectCategory] = useState("");
  const [subjectTopics, setSubjectTopics] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] =
  useState<number | null>(null);
  const [subjectTopicsData, setSubjectTopicsData] = useState<
  Record<number, { id: number; topic: string; completed: boolean }[]>
>({});

  /*
   * Working copy of a subject's topics while the Edit modal is open.
   * Lets the user tick/untick "learned" topics and see the live
   * Learned X / Y + Progress % before saving.
   */
  const [editTopics, setEditTopics] = useState<
    { id: number; topic: string; completed: boolean }[]
  >([]);
  const [editTopicsLoading, setEditTopicsLoading] = useState(false);
  const [newEditTopicName, setNewEditTopicName] = useState("");
  /* =======================================================
   NOTES
======================================================= */

const [showNotes, setShowNotes] = useState(false);

const [notes, setNotes] = useState<Note[]>([]);

const [noteTitle, setNoteTitle] = useState("");
const [noteSubject, setNoteSubject] = useState("");
const [noteContent, setNoteContent] = useState("");
const [noteTags, setNoteTags] = useState("");

const [editingNoteId, setEditingNoteId] =
  useState<number | null>(null);

const [viewingNote, setViewingNote] =
  useState<Note | null>(null);

const [noteSearch, setNoteSearch] = useState("");
const [noteFilter, setNoteFilter] = useState("All");

  /* STUDYBUDDY */
  const [showAssistant, setShowAssistant] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  /* QUIZ */
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);

  const [materialName, setMaterialName] = useState("");
  const [materialText, setMaterialText] = useState("");
  const materialInputRef =
  useRef<HTMLInputElement | null>(null);

  // Separate ref for the file input inside the Quiz Setup modal.
  // Using the SAME ref as materialInputRef here would be a bug:
  // React refs can only point to one mounted DOM node, so whichever
  // <input> renders last "wins" and the other one silently breaks.
  const quizMaterialInputRef =
  useRef<HTMLInputElement | null>(null);

const handleMaterialUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  // Allow only text/markdown files
  const allowedTypes = [
    ".txt",
    ".md",
  ];

  const extension =
    "." +
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (!allowedTypes.includes(extension)) {
    alert(
      "Please upload a TXT or Markdown (.md) file."
    );

    event.target.value = "";
    return;
  }

  try {
    const text = await file.text();

    setMaterialName(file.name);
    setMaterialText(text);

    // Open quiz setup after successful upload
    setShowQuizSetup(true);
  } catch (error) {
  console.error(
    "Material upload error:",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Could not read the uploaded material."
  );
}
};

const openEditSubject = async (subject: UserSubject) => {
  setEditingSubjectId(subject.id);
  setSubjectName(subject.name);
  setSubjectCategory(subject.category);
  setShowAddSubject(true);
  setEditTopicsLoading(true);

  const fallbackTopics = subject.topics.map((topic, index) => ({
    id: -(Date.now() + index),
    topic,
    completed: false,
  }));

  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setEditTopics(fallbackTopics);
      return;
    }

    const { data, error } = await supabase
      .from("subject_topics")
      .select("id, topic, completed")
      .eq("subject_id", subject.id)
      .eq("user_id", user.id)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    setEditTopics(rows.length > 0 ? rows : fallbackTopics);
  } catch (error) {
    console.error("Could not load topics for editing:", error);
    setEditTopics(fallbackTopics);
  } finally {
    setEditTopicsLoading(false);
  }
};

/*
 * Toggle / add / remove a topic row while editing a subject.
 * Newly added rows get a temporary negative id until they're
 * saved to the database.
 */
const toggleEditTopic = (id: number) => {
  setEditTopics((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, completed: !item.completed }
        : item
    )
  );
};

const removeEditTopic = (id: number) => {
  setEditTopics((previous) =>
    previous.filter((item) => item.id !== id)
  );
};

const addEditTopic = () => {
  const name = newEditTopicName.trim();
  if (!name) return;

  setEditTopics((previous) => [
    ...previous,
    {
      id: -(Date.now() + previous.length),
      topic: name,
      completed: false,
    },
  ]);

  setNewEditTopicName("");
};

const updateSubject = async () => {
  if (editingSubjectId === null) return;

  if (!subjectName.trim()) {
    alert("Please enter a subject name.");
    return;
  }

  const supabase = createClient();

  const cleanedTopics = editTopics
    .map((item) => ({ ...item, topic: item.topic.trim() }))
    .filter((item) => item.topic.length > 0);

  const learnedCount = cleanedTopics.filter(
    (item) => item.completed
  ).length;

  const progress =
    cleanedTopics.length > 0
      ? Math.round(
          (learnedCount / cleanedTopics.length) * 100
        )
      : 0;

  setSavingSubject(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    /*
     * Update the subject itself, including the freshly
     * computed progress from the checklist.
     */
    const { data, error } = await supabase
      .from("subjects")
      .update({
        name: subjectName.trim(),
        category:
          subjectCategory.trim() ||
          subjectName.trim(),
        topics: cleanedTopics.map((item) => item.topic),
        progress,
      })
      .eq("id", editingSubjectId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    /*
     * Work out which existing topic rows were removed
     * (present before editing, missing from the checklist now).
     */
    const existingRows =
      subjectTopicsData[editingSubjectId] ?? [];

    const keptIds = new Set(
      cleanedTopics
        .filter((item) => item.id > 0)
        .map((item) => item.id)
    );

    const idsToDelete = existingRows
      .filter((row) => !keptIds.has(row.id))
      .map((row) => row.id);

    if (idsToDelete.length > 0) {
      const { error: deleteTopicsError } = await supabase
        .from("subject_topics")
        .delete()
        .in("id", idsToDelete)
        .eq("user_id", user.id);

      if (deleteTopicsError) {
        throw deleteTopicsError;
      }
    }

    /*
     * Update the topic name / completed flag for existing rows.
     */
    for (const item of cleanedTopics) {
      if (item.id > 0) {
        const { error: updateTopicError } = await supabase
          .from("subject_topics")
          .update({
            topic: item.topic,
            completed: item.completed,
          })
          .eq("id", item.id)
          .eq("user_id", user.id);

        if (updateTopicError) {
          throw updateTopicError;
        }
      }
    }

    /*
     * Insert any newly added topics (temporary negative ids).
     */
    const newTopicRows = cleanedTopics
      .filter((item) => item.id < 0)
      .map((item) => ({
        subject_id: editingSubjectId,
        user_id: user.id,
        topic: item.topic,
        completed: item.completed,
      }));

    if (newTopicRows.length > 0) {
      const { error: insertTopicsError } = await supabase
        .from("subject_topics")
        .insert(newTopicRows);

      if (insertTopicsError) {
        throw insertTopicsError;
      }
    }

    const updatedSubject = {
      ...(data as UserSubject),
      progress,
    };

    /*
     * Refresh topics for this subject
     */
    await loadSubjectTopics(editingSubjectId);

    setSubjects((previous) =>
      previous.map((subject) =>
        subject.id === editingSubjectId
          ? updatedSubject
          : subject
      )
    );

    setEditingSubjectId(null);
    setSubjectName("");
    setSubjectCategory("");
    setSubjectTopics("");
    setEditTopics([]);
    setNewEditTopicName("");
    setShowAddSubject(false);
  } catch (error) {
    console.error(
      "Could not update subject:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not update the subject."
    );
  } finally {
    setSavingSubject(false);
  }
};

/*
 * =======================================================
 * LOAD SUBJECT TOPICS
 * =======================================================
 */

const loadSubjectTopics = async (
  subjectId: number
) => {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("subject_topics")
      .select("id, topic, completed")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id)
      .order("id", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    setSubjectTopicsData((previous) => ({
      ...previous,
      [subjectId]: data ?? [],
    }));
  } catch (error) {
    console.error(
      "Could not load subject topics:",
      error
    );
  }
};

/*
 * =======================================================
 * LOAD STUDY SESSIONS
 * =======================================================
 */

const loadStudySessions = async (uid: string) => {
  try {
    const { data, error } = await supabase
      .from("study_sessions")
      .select(
        "id, subject, task, start_time, end_time, session_date, completed"
      )
      .eq("user_id", uid)
      .order("session_date", { ascending: false })
      .order("start_time", { ascending: true });

    if (error) {
      throw error;
    }

    setSessions((data ?? []) as StudySession[]);
  } catch (error) {
    console.error(
      "Could not load study sessions:",
      error
    );
  }
};

/*
 * =======================================================
 * TOGGLE TOPIC COMPLETION
 * =======================================================
 */

const toggleSubjectTopic = async (
  subjectId: number,
  topicId: number,
  completed: boolean
) => {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    /*
     * Update topic completion
     */
    const { error } = await supabase
      .from("subject_topics")
      .update({
        completed: !completed,
      })
      .eq("id", topicId)
      .eq("subject_id", subjectId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    /*
     * Update topic state locally
     */
    const currentTopics =
      subjectTopicsData[subjectId] ?? [];

    const updatedTopics = currentTopics.map(
      (item) =>
        item.id === topicId
          ? {
              ...item,
              completed: !completed,
            }
          : item
    );

    setSubjectTopicsData((previous) => ({
      ...previous,
      [subjectId]: updatedTopics,
    }));

    /*
     * Calculate progress
     */
    const completedCount =
      updatedTopics.filter(
        (item) => item.completed
      ).length;

    const progress =
      updatedTopics.length > 0
        ? Math.round(
            (completedCount /
              updatedTopics.length) *
              100
          )
        : 0;

    /*
     * Save progress to subjects table
     */
    const {
      error: progressError,
    } = await supabase
      .from("subjects")
      .update({
        progress,
      })
      .eq("id", subjectId)
      .eq("user_id", user.id);

    if (progressError) {
      throw progressError;
    }

    /*
     * Update progress on screen
     */
    setSubjects((previous) =>
      previous.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              progress,
            }
          : subject
      )
    );
  } catch (error) {
    console.error(
      "Could not update topic:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not update the topic."
    );
  }
};

/*
 * =======================================================
 * DELETE SUBJECT
 * =======================================================
 */

const deleteSubject = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this subject?"
  );

  if (!confirmed) return;

  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    setSubjects((previous) =>
      previous.filter(
        (subject) => subject.id !== id
      )
    );

    setSubjectTopicsData((previous) => {
      const updated = {
        ...previous,
      };

      delete updated[id];

      return updated;
    });

    if (editingSubjectId === id) {
      setEditingSubjectId(null);
      setSubjectName("");
      setSubjectCategory("");
      setSubjectTopics("");
      setShowAddSubject(false);
    }
  } catch (error) {
    console.error(
      "Could not delete subject:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not delete the subject."
    );
  }
};

/*
 * =======================================================
 * TIME PLAN
 * =======================================================
 */


const [showTimePlan, setShowTimePlan] =
  useState(false);

/*
 * All study sessions for the logged-in user, straight from
 * the `study_sessions` table. Today's rows are projected into
 * `timePlan` below so the rest of the UI keeps working.
 */
const [sessions, setSessions] =
  useState<StudySession[]>([]);

const timePlan = useMemo<TimePlanItem[]>(() => {
  const key = todayKey();

  return sessions
    .filter((item) => item.session_date === key)
    .map((item) => ({
      id: item.id,
      subject: item.subject,
      task: item.task,
      start: toTimeInput(item.start_time),
      end: toTimeInput(item.end_time),
      completed: item.completed,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}, [sessions]);

const [localDataHydrated, setLocalDataHydrated] =
  useState(false);


const [editingPlanId, setEditingPlanId] =
  useState<number | null>(null);

const [planSubject, setPlanSubject] =
  useState("");

const [planTask, setPlanTask] =
  useState("");

const [planStart, setPlanStart] =
  useState("18:00");

const [planEnd, setPlanEnd] =
  useState("19:00");

/*
 * =======================================================
 * LOAD LOGGED-IN USER + THEIR SUBJECTS
 * =======================================================
 */

useEffect(() => {
  let mounted = true;

  const loadUserAndSubjects = async () => {
    setSubjectsLoading(true);

    try {
      const supabase = createClient();

      const {
        data,
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (!mounted) return;

      setUserId(user.id);

      const {
        data: subjectRows,
        error: subjectsError,
      } = await supabase
        .from("subjects")
        .select(
          "id, name, category, topics, progress, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (subjectsError) {
        throw subjectsError;
      }

      const loadedSubjects =
        (subjectRows ?? []) as UserSubject[];

      if (!mounted) return;

      setSubjects(loadedSubjects);

      /*
       * Load the user's study sessions.
       */
      await loadStudySessions(user.id);

      /*
       * Load topics for every subject.
       */
      for (const subject of loadedSubjects) {
        if (!mounted) return;

        await loadSubjectTopics(subject.id);
      }
    } catch (error) {
      console.error(
        "Could not load user subjects:",
        error
      );

      if (mounted) {
        setSubjects([]);
        setSubjectTopicsData({});
      }
    } finally {
      if (mounted) {
        setSubjectsLoading(false);
      }
    }
  };

  loadUserAndSubjects();

  return () => {
    mounted = false;
  };
}, [supabase]);

/*
 * =======================================================
 * ADD SUBJECT
 * =======================================================
 */

const resetSubjectForm = () => {
  setSubjectName("");
  setSubjectCategory("");
  setSubjectTopics("");
  setEditingSubjectId(null);
  setEditTopics([]);
  setEditTopicsLoading(false);
  setNewEditTopicName("");
};

const addSubject = async () => {
  if (!subjectName.trim()) {
    alert("Please enter a subject name.");
    return;
  }

  const supabase = createClient();

  const topics = subjectTopics
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);

  setSavingSubject(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login again.");
      return;
    }

    /*
     * 1. Create subject
     */
    const {
      data: subject,
      error: subjectError,
    } = await supabase
      .from("subjects")
      .insert({
        user_id: user.id,
        name: subjectName.trim(),
        category:
          subjectCategory.trim() ||
          subjectName.trim(),
        topics,
        progress: 0,
      })
      .select()
      .single();

    if (subjectError) {
      throw subjectError;
    }

    /*
     * 2. Create individual topics
     */
    if (topics.length > 0) {
      const topicRows = topics.map((topic) => ({
        subject_id: subject.id,
        user_id: user.id,
        topic,
        completed: false,
      }));

      const {
        error: topicsError,
      } = await supabase
        .from("subject_topics")
        .insert(topicRows);

      if (topicsError) {
        await supabase
          .from("subjects")
          .delete()
          .eq("id", subject.id)
          .eq("user_id", user.id);

        throw topicsError;
      }
    }

    /*
     * 3. Add subject to UI
     */
    setSubjects((previous) => [
      ...previous,
      subject as UserSubject,
    ]);

    /*
     * 4. Store topics in UI state
     */
    await loadSubjectTopics(subject.id);

    /*
     * 5. Reset form
     */
    resetSubjectForm();
    setShowAddSubject(false);
  } catch (error) {
    console.error(
      "Could not add subject:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not add the subject."
    );
  } finally {
    setSavingSubject(false);
  }
};


/* =======================================================
   TIME PLAN HELPERS
======================================================= */

const getDuration = (start: string, end: string) => {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 0;
  }

  let startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  // Allow a session to cross midnight.
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal - startTotal;
};

const formatHours = (minutes: number) => {
  if (!minutes || minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const totalPlannedMinutes = useMemo(
  () =>
    timePlan.reduce(
      (total, item) =>
        total + getDuration(item.start, item.end),
      0
    ),
  [timePlan]
);

const completedMinutes = useMemo(
  () =>
    timePlan.reduce(
      (total, item) =>
        item.completed
          ? total + getDuration(item.start, item.end)
          : total,
      0
    ),
  [timePlan]
);

const completedSessions = useMemo(
  () => timePlan.filter((item) => item.completed).length,
  [timePlan]
);

const planProgress = useMemo(
  () =>
    timePlan.length > 0
      ? Math.round(
          (completedSessions / timePlan.length) * 100
        )
      : 0,
  [completedSessions, timePlan.length]
);

const resetPlanForm = () => {
  setEditingPlanId(null);
  setPlanSubject("");
  setPlanTask("");
  setPlanStart("18:00");
  setPlanEnd("19:00");
};

const savePlanItem = async () => {
  if (!planSubject.trim()) {
    alert("Please enter a subject.");
    return;
  }

  if (!planTask.trim()) {
    alert("Please enter a task or topic.");
    return;
  }

  if (!planStart || !planEnd) {
    alert("Please select both start and end times.");
    return;
  }

  if (getDuration(planStart, planEnd) <= 0) {
    alert("End time must be after the start time.");
    return;
  }

  if (!userId) {
    alert("Please login again.");
    return;
  }

  const payload = {
    user_id: userId,
    subject: planSubject.trim(),
    task: planTask.trim(),
    start_time: planStart,
    end_time: planEnd,
    session_date: todayKey(),
  };

  try {
    if (editingPlanId !== null) {
      const { data, error } = await supabase
        .from("study_sessions")
        .update(payload)
        .eq("id", editingPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSessions((previous) =>
        previous.map((item) =>
          item.id === editingPlanId
            ? (data as StudySession)
            : item
        )
      );
    } else {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({ ...payload, completed: false })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSessions((previous) => [
        ...previous,
        data as StudySession,
      ]);
    }

    resetPlanForm();
  } catch (error) {
    console.error(
      "Could not save study session:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not save the session."
    );
  }
};

const togglePlanItem = async (id: number) => {
  const target = sessions.find((item) => item.id === id);

  if (!target || !userId) return;

  // Optimistic flip, rolled back if the write fails.
  setSessions((previous) =>
    previous.map((item) =>
      item.id === id
        ? { ...item, completed: !item.completed }
        : item
    )
  );

  const { error } = await supabase
    .from("study_sessions")
    .update({ completed: !target.completed })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error(
      "Could not update session:",
      error
    );

    setSessions((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, completed: target.completed }
          : item
      )
    );
  }
};

const editPlanItem = (item: TimePlanItem) => {
  setEditingPlanId(item.id);
  setPlanSubject(item.subject);
  setPlanTask(item.task);
  setPlanStart(item.start);
  setPlanEnd(item.end);
};

const deletePlanItem = async (id: number) => {
  if (!window.confirm("Delete this study session?")) return;

  if (!userId) {
    alert("Please login again.");
    return;
  }

  try {
    const { error } = await supabase
      .from("study_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    setSessions((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (editingPlanId === id) {
      resetPlanForm();
    }
  } catch (error) {
    console.error(
      "Could not delete session:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not delete the session."
    );
  }
};

/* =======================================================
   REAL STATS (derived from study_sessions)
======================================================= */

const completedSessionRows = useMemo(
  () => sessions.filter((item) => item.completed),
  [sessions]
);

const completedDays = useMemo(
  () =>
    new Set(
      completedSessionRows.map(
        (item) => item.session_date
      )
    ),
  [completedSessionRows]
);

/* Consecutive days ending today (or yesterday, if today isn't done yet). */
const focusStreak = useMemo(() => {
  const cursor = new Date();

  if (!completedDays.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (completedDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}, [completedDays]);

const weekStartKey = useMemo(() => {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return toDateKey(start);
}, []);

const weekSessions = useMemo(
  () =>
    completedSessionRows.filter(
      (item) => item.session_date >= weekStartKey
    ).length,
  [completedSessionRows, weekStartKey]
);

const weekMinutes = useMemo(
  () =>
    completedSessionRows
      .filter((item) => item.session_date >= weekStartKey)
      .reduce(
        (total, item) =>
          total +
          getDuration(
            toTimeInput(item.start_time),
            toTimeInput(item.end_time)
          ),
        0
      ),
  [completedSessionRows, weekStartKey]
);

const weeklyTarget = useMemo(
  () =>
    Math.min(
      Math.round(
        (weekMinutes / (DAILY_GOAL_MINUTES * 7)) * 100
      ),
      100
    ),
  [weekMinutes]
);

const activeDaysThisWeek = useMemo(
  () =>
    new Set(
      completedSessionRows
        .filter(
          (item) => item.session_date >= weekStartKey
        )
        .map((item) => item.session_date)
    ).size,
  [completedSessionRows, weekStartKey]
);

const consistency = useMemo(() => {
  if (activeDaysThisWeek >= 6) return "EXCELLENT";
  if (activeDaysThisWeek >= 4) return "GOOD";
  if (activeDaysThisWeek >= 2) return "FAIR";
  return "LOW";
}, [activeDaysThisWeek]);

/* Subject that needs the most attention. */
const recommendedSubject = useMemo(() => {
  if (subjects.length === 0) return "—";

  const weakest = [...subjects].sort(
    (a, b) => a.progress - b.progress
  )[0];

  return weakest.category || weakest.name;
}, [subjects]);

/* =======================================================
   RECENT ACTIVITY
======================================================= */

const formatActivityTime = (
  dateKey: string,
  start: string
) => {
  const today = todayKey();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === today) {
    return `Today · ${toTimeInput(start)}`;
  }

  if (dateKey === toDateKey(yesterday)) {
    return `Yesterday · ${toTimeInput(start)}`;
  }

  return new Date(dateKey).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
};

const activities = useMemo(
  () =>
    [...completedSessionRows]
      .sort((a, b) =>
        a.session_date === b.session_date
          ? b.start_time.localeCompare(a.start_time)
          : b.session_date.localeCompare(a.session_date)
      )
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.task,
        subject: item.subject,
        time: formatActivityTime(
          item.session_date,
          item.start_time
        ),
        icon: CheckCircle2,
      })),
  [completedSessionRows]
);

/* =======================================================
   NOTES
======================================================= */

const formatNoteDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "just now";

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const resetNoteForm = () => {
  setEditingNoteId(null);
  setNoteTitle("");
  setNoteSubject("");
  setNoteContent("");
  setNoteTags("");
};

const saveNote = () => {
  if (!noteTitle.trim()) {
    alert("Please enter a note title.");
    return;
  }

  if (!noteContent.trim()) {
    alert("Please enter some note content.");
    return;
  }

  const now = new Date().toISOString();
  const tags = noteTags
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  const existingNote =
    editingNoteId !== null
      ? notes.find((note) => note.id === editingNoteId)
      : null;

  const note: Note = {
    id:
      editingNoteId !== null
        ? editingNoteId
        : Date.now(),
    title: noteTitle.trim(),
    subject: noteSubject.trim() || "General",
    content: noteContent.trim(),
    tags,
    pinned: existingNote?.pinned ?? false,
    createdAt: existingNote?.createdAt ?? now,
    updatedAt: now,
  };

  setNotes((previous) => {
    const next =
      editingNoteId !== null
        ? previous.map((item) =>
            item.id === editingNoteId ? note : item
          )
        : [note, ...previous];

    return [...next].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );
  });

  setViewingNote(null);
  resetNoteForm();
};

const editNote = (note: Note) => {
  setEditingNoteId(note.id);
  setNoteTitle(note.title);
  setNoteSubject(note.subject);
  setNoteContent(note.content);
  setNoteTags(note.tags.join(", "));
  setViewingNote(null);
  setShowNotes(true);
};

const deleteNote = (id: number) => {
  if (!window.confirm("Delete this note?")) return;

  setNotes((previous) =>
    previous.filter((note) => note.id !== id)
  );

  if (viewingNote?.id === id) {
    setViewingNote(null);
  }

  if (editingNoteId === id) {
    resetNoteForm();
  }
};

const togglePinNote = (id: number) => {
  setNotes((previous) =>
    previous.map((note) =>
      note.id === id
        ? {
            ...note,
            pinned: !note.pinned,
            updatedAt: new Date().toISOString(),
          }
        : note
    )
  );
};

const noteSubjects = useMemo(() => {
  const subjectsFromNotes = notes
    .map((note) => note.subject.trim())
    .filter(Boolean);

  return [
    "All",
    ...Array.from(new Set(subjectsFromNotes)).sort(),
  ];
}, [notes]);

const filteredNotes = useMemo(() => {
  const search = noteSearch.trim().toLowerCase();

  return [...notes]
    .filter((note) => {
      const matchesSubject =
        noteFilter === "All" ||
        note.subject === noteFilter;

      if (!matchesSubject) return false;
      if (!search) return true;

      return [
        note.title,
        note.subject,
        note.content,
        ...note.tags,
      ].some((value) =>
        value.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return (
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
      );
    });
}, [notes, noteSearch, noteFilter]);

/* =======================================================
   PERSIST LOCAL NOTES
======================================================= */

useEffect(() => {
  try {
    const savedNotes = window.localStorage.getItem(
      "thinksync-notes"
    );

    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      if (Array.isArray(parsed)) {
        setNotes(parsed);
      }
    }
  } catch (error) {
    console.error("Could not restore local notes:", error);
  } finally {
    setLocalDataHydrated(true);
  }
}, []);

useEffect(() => {
  if (!localDataHydrated) return;

  try {
    window.localStorage.setItem(
      "thinksync-notes",
      JSON.stringify(notes)
    );
  } catch (error) {
    console.error("Could not save notes:", error);
  }
}, [notes, localDataHydrated]);

/* =======================================================
   QUIZ
======================================================= */

const [currentQuestion, setCurrentQuestion] =
  useState(0);
const [selectedAnswer, setSelectedAnswer] =
  useState<number | null>(null);
const [quizScore, setQuizScore] = useState(0);
const [quizFinished, setQuizFinished] = useState(false);

const generateQuiz = async () => {
  const topic = selectedSubject.trim();

  if (!topic && !materialText.trim()) {
    alert("Please choose a subject, enter a topic, or upload study material.");
    return;
  }

  setQuizLoading(true);
  setQuizFinished(false);
  setCurrentQuestion(0);
  setSelectedAnswer(null);
  setQuizScore(0);

  try {
    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        subject: topic,
        difficulty,
        questionCount,
        material: materialText.trim(),
        materialName,
      }),
    });

    const contentType =
      response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      const errorText = await response.text();

      console.error(
        "Quiz API returned non-JSON:",
        errorText
      );

      throw new Error(
        `Quiz API returned an unexpected response (${response.status}).`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Failed to generate quiz."
      );
    }

    if (
      !data?.quiz ||
      !Array.isArray(data.quiz.questions) ||
      data.quiz.questions.length === 0
    ) {
      throw new Error(
        "The AI did not return a valid quiz."
      );
    }

    setQuiz(data.quiz);
    setShowQuizSetup(false);
    setShowQuiz(true);
  } catch (error) {
    console.error("Quiz generation error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to generate quiz."
    );
  } finally {
    setQuizLoading(false);
  }
};

/* =======================================================
   STUDYBUDDY
======================================================= */

const sendMessage = async () => {
  const trimmedMessage = message.trim();

  if (!trimmedMessage || loading) return;

  const userMessage: ChatMessage = {
    role: "user",
    content: trimmedMessage,
  };

  setMessages((previous) => [
    ...previous,
    userMessage,
  ]);

  setMessage("");
  setLoading(true);

  try {
    const response = await fetch("/api/studybuddy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: trimmedMessage,
        messages: [...messages, userMessage],
        subject: selectedSubject,
      }),
    });

    const contentType =
      response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      const errorText = await response.text();

      console.error(
        "StudyBuddy API returned non-JSON:",
        errorText
      );

      throw new Error(
        `StudyBuddy API returned an unexpected response (${response.status}).`
      );
    }

    const data = await response.json();

    console.log("StudyBuddy API response:", data);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "StudyBuddy could not answer right now."
      );
    }

    // IMPORTANT:
    // route.ts returns { reply: "..." }
    const assistantContent =
      data?.reply ||
      data?.message ||
      data?.answer ||
      data?.response ||
      data?.content;

    if (!assistantContent) {
      console.error(
        "StudyBuddy returned no usable reply:",
        data
      );

      throw new Error(
        "StudyBuddy returned an empty response."
      );
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content: String(assistantContent),
      },
    ]);
  } catch (error) {
    console.error(
      "StudyBuddy error:",
      error
    );

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I could not answer that right now.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};

const sendSuggestion = (suggestion: string) => {
  if (loading) return;
  setMessage(suggestion);

  window.setTimeout(() => {
    const input = document.getElementById(
      "studybuddy-input"
    ) as HTMLInputElement | null;

    input?.focus();
  }, 0);
};

/* =======================================================
   INTRO
======================================================= */

useEffect(() => {
  const timer = window.setTimeout(() => {
    setIntroFinished(true);
  }, 2200);

  return () => window.clearTimeout(timer);
}, []);

  /* =======================================================
     RESET QUIZ
  ======================================================= */

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  /* =======================================================
     NEXT QUESTION
  ======================================================= */

  const nextQuestion = () => {
    if (!quiz || selectedAnswer === null)
      return;

    const current =
      quiz.questions[currentQuestion];

    if (
      selectedAnswer ===
      current.correctAnswer
    ) {
      setQuizScore(
        (score) => score + 1
      );
    }

    if (
      currentQuestion <
      quiz.questions.length - 1
    ) {
      setCurrentQuestion(
        (question) => question + 1
      );
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <main className="study-page">
      {/* =====================================================
          INTRO
      ===================================================== */}

      {!introFinished && (
        <section className="intro-screen">
          <div className="intro-grid" />

          <div className="intro-glow intro-glow-one" />
          <div className="intro-glow intro-glow-two" />

          <div className="intro-top">
            THINKSYNC / STUDENT OS
          </div>

          <div className="intro-logo">
            <div className="logo-mark">
              <BookOpen
                size={34}
                strokeWidth={1.4}
              />
            </div>

            <div className="logo-name">
              THINK<span>SYNC</span>
            </div>
          </div>

          <div className="intro-title">
            <p>STUDY / INTELLIGENCE</p>

            <h1>
              STUDY
              <br />
              <span>BUDDY</span>
            </h1>
          </div>

          <div className="floating-card card-one">
            <div className="floating-image">
              <BookOpen size={30} />
            </div>

            <div>
              <strong>LEARN</strong>
              <span>
                Smart explanations
              </span>
            </div>
          </div>

          <div className="floating-card card-two">
            <div className="floating-image">
              <BrainCircuit size={30} />
            </div>

            <div>
              <strong>THINK</strong>
              <span>
                AI powered learning
              </span>
            </div>
          </div>

          <div className="floating-card card-three">
            <div className="floating-image">
              <Target size={30} />
            </div>

            <div>
              <strong>FOCUS</strong>
              <span>
                Build better habits
              </span>
            </div>
          </div>

          <div className="floating-card card-four">
            <div className="floating-image">
              <Trophy size={30} />
            </div>

            <div>
              <strong>GROW</strong>
              <span>
                Track your progress
              </span>
            </div>
          </div>

          <div className="intro-orb">
            <div className="intro-orbit orbit-one" />
            <div className="intro-orbit orbit-two" />
            <div className="intro-orbit orbit-three" />

            <div className="intro-orb-core">
              <BookOpen
                size={48}
                strokeWidth={1.2}
              />
            </div>
          </div>

          <div className="intro-bottom">
            <span>
              THINKSYNC / STUDYBUDDY
            </span>

            <span>
              ENTERING LEARNING SPACE
            </span>

            <span>01 / 03</span>
          </div>
        </section>
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div
        className={`main-content ${
          introFinished
            ? "show-content"
            : ""
        }`}
      >
        <div className="background-grid" />

        <div className="background-glow glow-cyan" />
        <div className="background-glow glow-violet" />
        <div className="background-glow glow-pink" />

        {/* NAVBAR */}

        <header className="topbar">
          <div className="brand-area">
            <a
              href="/dashboard"
              className="back-button"
            >
              <ArrowLeft size={17} />
            </a>

            <div className="brand">
              THINK<span>SYNC</span>
            </div>

            <div className="separator" />

            <div className="module-name">
              <BookOpen size={15} />
              STUDYBUDDY
            </div>
          </div>

          <div className="top-status">
            <span className="status-dot" />
            AI CORE ONLINE
          </div>
        </header>

        <div className="page-content">
          {/* HERO */}

          <section className="hero">
            <div className="hero-copy">
  <p className="eyebrow">
    <Sparkles size={13} />
    YOUR INTELLIGENT STUDY
    COMPANION
  </p>

  <h1>
    STUDY
    <br />
    <span>SMARTER.</span>
  </h1>

  <p className="hero-description">
    Learn faster, understand deeper,
    and stay consistent with your
    personal AI-powered study workspace.
  </p>

  <div className="hero-actions">
    <button
      className="primary-button"
      onClick={() => setShowAssistant(true)}
    >
      <BrainCircuit size={17} />
      ASK STUDYBUDDY
      <ArrowUpRight size={16} />
    </button>

    <button
      className="secondary-button"
      onClick={() =>
        materialInputRef.current?.click()
      }
    >
      <Upload size={16} />
      UPLOAD MATERIAL
    </button>

    <input
      ref={materialInputRef}
      type="file"
      accept=".txt,.md,text/plain,text/markdown"
      hidden
      onChange={handleMaterialUpload}
    />
  </div>
</div>

<div className="ai-orb-area">
  <div className="orb-orbit orbit-a" />
  <div className="orb-orbit orbit-b" />
  <div className="orb-orbit orbit-c" />

  <div className="orb-particle particle-one" />
  <div className="orb-particle particle-two" />
  <div className="orb-particle particle-three" />

  <div className="ai-orb">
    <div className="orb-inner">
      <BrainCircuit
        size={52}
        strokeWidth={1.2}
      />
    </div>
  </div>

  <div className="orb-label">
    <span>STUDYBUDDY</span>
    <small>READY TO HELP</small>
  </div>
</div>
</section>
            

          {/* =================================================
              TIME PLAN SUMMARY
          ================================================= */}

          <section className="time-plan-strip">
            <div className="time-plan-main">
              <div className="time-plan-icon">
                <CalendarDays size={22} />
              </div>

              <div>
                <p>
                  TODAY&apos;S TIME PLAN
                </p>

                <h3>
                  {completedSessions} /{" "}
                  {timePlan.length} SESSIONS
                  COMPLETED
                </h3>
              </div>
            </div>

            <div className="time-plan-stats">
              <div>
                <span>PLANNED</span>
                <strong>
                  {formatHours(
                    totalPlannedMinutes
                  )}
                </strong>
              </div>

              <div>
                <span>COMPLETED</span>
                <strong>
                  {formatHours(
                    completedMinutes
                  )}
                </strong>
              </div>

              <div>
                <span>PROGRESS</span>
                <strong>
                  {planProgress}%
                </strong>
              </div>
            </div>

            <button
              className="time-plan-open"
              onClick={() =>
                setShowTimePlan(true)
              }
            >
              OPEN TIME PLAN
              <ArrowUpRight size={16} />
            </button>
          </section>

          {/* STATS */}

          <section className="stats">
            <div className="stat-card">
              <div className="stat-icon cyan">
                <Target size={18} />
              </div>

              <div>
                <small>
                  TODAY&apos;S GOAL
                </small>

                <strong>
                  {formatHours(
                    completedMinutes
                  )}{" "}
                  / 4 HOURS
                </strong>
              </div>

              <div className="stat-progress">
                <span
                  style={{
                    width: `${Math.min(
                      (completedMinutes /
                        DAILY_GOAL_MINUTES) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <Flame size={18} />
              </div>

              <div>
                <small>
                  FOCUS STREAK
                </small>

                <strong>
                  {String(
                    focusStreak
                  ).padStart(2, "0")}{" "}
                  DAYS
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon violet">
                <Trophy size={18} />
              </div>

              <div>
                <small>
                  THIS WEEK
                </small>

                <strong>
                  {weekSessions} SESSIONS
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Clock3 size={18} />
              </div>

              <div>
                <small>
                  FOCUS TIME
                </small>

                <strong>
                  {formatHours(
                    completedMinutes
                  )}
                </strong>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  INTELLIGENT TOOLS
                </p>

                <h2>
                  WHAT DO YOU WANT{" "}
                  <span>
                    TO DO?
                  </span>
                </h2>
              </div>
            </div>

            <div className="action-grid">
              {quickActions.map(
                (action) => {
                  const Icon =
                    action.icon;

                  return (
                    <button
                      key={action.title}
                      className={`action-card ${action.tone}`}
                      onClick={() => {
                        if (
                          action.title ===
                          "Ask StudyBuddy"
                        ) {
                          setShowAssistant(
                            true
                          );
                        }

                        if (
                          action.title ===
                          "Generate Quiz"
                        ) {
                          setShowQuizSetup(
                            true
                          );
                        }

                        if (
                          action.title ===
                          "Study Plan"
                        ) {
                          setShowTimePlan(
                            true
                          );
                        }

                        if (
                          action.title ===
                          "My Notes"
                        ) {
                          setShowNotes(true);
                        }
                      }}
                    >
                      <div className="action-top">
                        <div className="action-icon">
                          <Icon
                            size={21}
                            strokeWidth={
                              1.5
                            }
                          />
                        </div>

                        <ArrowUpRight
                          size={18}
                        />
                      </div>

                      <div className="action-content">
                        <h3>
                          {action.title}
                        </h3>

                        <p>
                          {
                            action.description
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* SUBJECTS */}

          <section className="section">
            <div className="section-heading split">
              <div>
                <p className="eyebrow">
                  YOUR SUBJECTS
                </p>

                <h2>
                  KEEP{" "}
                  <span>
                    PROGRESSING.
                  </span>
                </h2>
              </div>

              <button className="view-button">
                VIEW ALL
                <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="subject-grid">
              {subjectsLoading ? (
                <div className="subject-empty-state">
                  Loading your subjects...
                </div>
              ) : subjects.length === 0 ? (
                <div className="subject-empty-state">
                  <strong>No subjects yet.</strong>
                  <span>Add your first subject to create your personal learning workspace.</span>
                </div>
              ) : (
                subjects.map((subject, index) => (
                  <div
                    key={subject.id}
                    className={`subject-card ${getSubjectTone(index)}`}
                  >
                    <div className="subject-top">
                      <span>{getSubjectShort(subject)}</span>

                      <div className="subject-circle">
                        {subject.progress}%
                      </div>
                    </div>
                    <div className="subject-actions">
  <button
    type="button"
    onClick={() => openEditSubject(subject)}
    title="Edit subject"
    aria-label={`Edit ${subject.name}`}
  >
    <Pencil size={14} />
  </button>

  <button
    type="button"
    className="delete"
    onClick={() => deleteSubject(subject.id)}
    title="Delete subject"
    aria-label={`Delete ${subject.name}`}
  >
    <Trash2 size={14} />
  </button>
</div>

                    <h3>{subject.name}</h3>

                    <p>
                      {subject.topics.length > 0
                        ? subject.topics.join(" · ")
                        : subject.category}
                    </p>

                    <div className="progress-track">
                      <span
                        style={{
                          width: `${subject.progress}%`,
                        }}
                      />
                    </div>

                    <div className="subject-footer">
                      <span>
                        {(subjectTopicsData[subject.id] ?? []).filter(
                          (item) => item.completed
                        ).length}
                        {" / "}
                        {(subjectTopicsData[subject.id] ?? []).length} TOPICS
                      </span>
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                className="add-subject"
                onClick={() => setShowAddSubject(true)}
              >
                <div className="add-icon">
                  <Plus size={20} />
                </div>

                <strong>ADD SUBJECT</strong>

                <span>
                  Create a new
                  learning
                  <br />
                  workspace.
                </span>
              </button>
            </div>

            {showAddSubject && (
              <div className="subject-modal-overlay">
                <div className="subject-modal" role="dialog" aria-modal="true">
                  <div className="subject-modal-header">
                    <div>
                      <p className="eyebrow">NEW LEARNING WORKSPACE</p>
                      <h3>
  {editingSubjectId !== null
    ? "Edit Subject"
    : "Add Subject"}
</h3>
                    </div>

                    <button
                      type="button"
                      className="modal-close"
                      onClick={() => {
                        setShowAddSubject(false);
                        resetSubjectForm();
                      }}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <label>
                    SUBJECT NAME
                    <input
                      value={subjectName}
                      onChange={(event) => setSubjectName(event.target.value)}
                      placeholder="e.g. Data Structures"
                      autoFocus
                    />
                  </label>

                  <label>
                    CATEGORY
                    <input
                      value={subjectCategory}
                      onChange={(event) => setSubjectCategory(event.target.value)}
                      placeholder="e.g. DSA, DE, MATH"
                    />
                  </label>

                  {editingSubjectId !== null ? (
                    <div className="edit-topics-block">
                      <p className="edit-topics-label">TOPICS</p>

                      {editTopicsLoading ? (
                        <div className="edit-topics-loading">
                          Loading topics...
                        </div>
                      ) : (
                        <>
                          <div className="edit-topics-list">
                            {editTopics.length === 0 ? (
                              <div className="edit-topics-empty">
                                No topics yet. Add one below.
                              </div>
                            ) : (
                              editTopics.map((item) => (
                                <div
                                  className="edit-topic-row"
                                  key={item.id}
                                >
                                  <button
                                    type="button"
                                    className={
                                      item.completed
                                        ? "edit-topic-checkbox checked"
                                        : "edit-topic-checkbox"
                                    }
                                    onClick={() =>
                                      toggleEditTopic(item.id)
                                    }
                                    aria-pressed={item.completed}
                                    aria-label={`Mark ${item.topic} as ${
                                      item.completed
                                        ? "not learned"
                                        : "learned"
                                    }`}
                                  >
                                    {item.completed && (
                                      <CheckCircle2 size={13} />
                                    )}
                                  </button>

                                  <span
                                    className={
                                      item.completed
                                        ? "learned"
                                        : ""
                                    }
                                  >
                                    {item.topic}
                                  </span>

                                  <button
                                    type="button"
                                    className="edit-topic-remove"
                                    onClick={() =>
                                      removeEditTopic(item.id)
                                    }
                                    aria-label={`Remove ${item.topic}`}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="edit-topic-add-row">
                            <input
                              value={newEditTopicName}
                              onChange={(event) =>
                                setNewEditTopicName(
                                  event.target.value
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addEditTopic();
                                }
                              }}
                              placeholder="Add a topic"
                            />

                            <button
                              type="button"
                              onClick={addEditTopic}
                              aria-label="Add topic"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="edit-topics-summary">
                            <span>
                              Learned:{" "}
                              {
                                editTopics.filter(
                                  (item) => item.completed
                                ).length
                              }{" "}
                              / {editTopics.length}
                            </span>

                            <span>
                              Progress:{" "}
                              {editTopics.length > 0
                                ? Math.round(
                                    (editTopics.filter(
                                      (item) => item.completed
                                    ).length /
                                      editTopics.length) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <label>
                      TOPICS
                      <input
                        value={subjectTopics}
                        onChange={(event) => setSubjectTopics(event.target.value)}
                        placeholder="Arrays, Strings, Trees"
                      />
                      <small>Separate topics with commas.</small>
                    </label>
                  )}

                  <div className="subject-modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowAddSubject(false);
                        resetSubjectForm();
                      }}
                    >
                      CANCEL
                    </button>

                   <button
  type="button"
  className="primary-button"
  onClick={
    editingSubjectId !== null
      ? updateSubject
      : addSubject
  }
  disabled={savingSubject}
>
  {editingSubjectId !== null ? (
    <Pencil size={16} />
  ) : (
    <Plus size={16} />
  )}

  {savingSubject
    ? "SAVING..."
    : editingSubjectId !== null
      ? "UPDATE SUBJECT"
      : "SAVE SUBJECT"}
</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* AI INSIGHT */}

          <section className="ai-insight">
            <div className="insight-orb" />

            <div className="insight-content">
              <p className="eyebrow">
                <Sparkles size={13} />
                STUDYBUDDY INSIGHT
              </p>

              <h2>
                YOUR MOMENTUM
                <br />
                IS{" "}
                <span>
                  {focusStreak > 0
                    ? "STRONG."
                    : "WAITING."}
                </span>
              </h2>

              <p>
                {focusStreak > 0
                  ? `You're on a ${focusStreak}-day streak and ${weeklyTarget}% of the way to your weekly target. A focused session on ${recommendedSubject} would keep you above pace.`
                  : "No completed sessions yet. Add a session to your time plan and mark it done to start building momentum."}
              </p>

              <button
                className="insight-button"
                onClick={() =>
                  setShowAssistant(
                    true
                  )
                }
              >
                ASK STUDYBUDDY WHY
                <ArrowUpRight
                  size={16}
                />
              </button>
            </div>

            <div className="insight-metrics">
              <div>
                <span>
                  WEEKLY TARGET
                </span>

                <strong>
                  {weeklyTarget}%
                </strong>
              </div>

              <div>
                <span>
                  CONSISTENCY
                </span>

                <strong>
                  {consistency}
                </strong>
              </div>

              <div>
                <span>
                  RECOMMENDED
                </span>

                <strong>
                  {recommendedSubject}
                </strong>
              </div>
            </div>
          </section>

          {/* ACTIVITY */}

          <section className="section activity-section">
            <div className="section-heading split">
              <div>
                <p className="eyebrow">
                  LEARNING TIMELINE
                </p>

                <h2>
                  RECENT{" "}
                  <span>
                    ACTIVITY.
                  </span>
                </h2>
              </div>
            </div>

            <div className="activity-list">
              {activities.length === 0 ? (
                <div className="empty-plan">
                  <Clock3 size={30} />

                  <strong>
                    No activity yet
                  </strong>

                  <span>
                    Complete a study session to
                    see it here.
                  </span>
                </div>
              ) : (
                activities.map(
                  (activity) => {
                    const Icon =
                      activity.icon;

                    return (
                      <div
                        className="activity-row"
                        key={
                          activity.id
                        }
                      >
                        <div className="activity-icon">
                          <Icon
                            size={18}
                          />
                        </div>

                        <div className="activity-main">
                          <strong>
                            {
                              activity.title
                            }
                          </strong>

                          <span>
                            {
                              activity.subject
                            }
                          </span>
                        </div>

                        <div className="activity-time">
                          {
                            activity.time
                          }
                        </div>

                        <ArrowUpRight
                          size={17}
                          className="activity-arrow"
                        />
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>

          <footer className="footer">
            <span>
              THINKSYNC /
              STUDYBUDDY
            </span>

            <span>
              LEARN · FOCUS ·
              GROW
            </span>

            <span>
              © 2026
            </span>
          </footer>
        </div>
      </div>

      {/* =====================================================
          TIME PLAN MODAL
      ===================================================== */}

      {showTimePlan && (
        <div
          className="assistant-overlay"
          onClick={() =>
            setShowTimePlan(false)
          }
        >
          <div
            className="assistant-panel time-plan-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-button"
              onClick={() =>
                setShowTimePlan(false)
              }
            >
              <X size={18} />
            </button>

            <div className="assistant-header">
              <div className="assistant-icon">
                <CalendarDays
                  size={25}
                />
              </div>

              <div>
                <p>
                  THINKSYNC /
                  PLANNER
                </p>

                <h3>
                  Today&apos;s Time
                  Plan
                </h3>
              </div>

              <span className="online-label">
                <i />
                PLAN ACTIVE
              </span>
            </div>

            {/* SUMMARY */}

            <div className="plan-summary">
              <div>
                <span>
                  PLANNED
                </span>

                <strong>
                  {formatHours(
                    totalPlannedMinutes
                  )}
                </strong>
              </div>

              <div>
                <span>
                  COMPLETED
                </span>

                <strong>
                  {formatHours(
                    completedMinutes
                  )}
                </strong>
              </div>

              <div>
                <span>
                  SESSIONS
                </span>

                <strong>
                  {
                    timePlan.length
                  }
                </strong>
              </div>

              <div>
                <span>
                  PROGRESS
                </span>

                <strong>
                  {planProgress}%
                </strong>
              </div>
            </div>

            <div className="plan-progress-large">
              <div>
                <span>
                  DAILY PLAN
                </span>

                <strong>
                  {planProgress}%
                </strong>
              </div>

              <div className="plan-progress-track">
                <span
                  style={{
                    width: `${planProgress}%`,
                  }}
                />
              </div>
            </div>

            {/* ADD FORM */}

            <div className="plan-form">
              <div className="plan-form-title">
                <Plus size={16} />

                {editingPlanId !==
                null
                  ? "EDIT STUDY SESSION"
                  : "ADD STUDY SESSION"}
              </div>

              <div className="plan-form-grid">
                <input
                  value={planSubject}
                  onChange={(event) =>
                    setPlanSubject(
                      event.target
                        .value
                    )
                  }
                  placeholder="Subject"
                />

                <input
                  value={planTask}
                  onChange={(event) =>
                    setPlanTask(
                      event.target
                        .value
                    )
                  }
                  placeholder="Task / Topic"
                />

                <label>
                  START
                  <input
                    type="time"
                    value={
                      planStart
                    }
                    onChange={(
                      event
                    ) =>
                      setPlanStart(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  END
                  <input
                    type="time"
                    value={
                      planEnd
                    }
                    onChange={(
                      event
                    ) =>
                      setPlanEnd(
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </div>

              <div className="plan-form-actions">
                <button
                  className="plan-save-button"
                  onClick={
                    savePlanItem
                  }
                >
                  {editingPlanId !==
                  null
                    ? "UPDATE SESSION"
                    : "ADD TO PLAN"}

                  <ArrowUpRight
                    size={16}
                  />
                </button>

                {editingPlanId !==
                  null && (
                  <button
                    className="plan-cancel-button"
                    onClick={
                      resetPlanForm
                    }
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </div>

            {/* TIMELINE */}

            <div className="plan-timeline">
              {timePlan.length ===
              0 ? (
                <div className="empty-plan">
                  <CalendarDays
                    size={30}
                  />

                  <strong>
                    No study sessions
                  </strong>

                  <span>
                    Add your first
                    session above.
                  </span>
                </div>
              ) : (
                timePlan.map(
                  (item) => (
                    <div
                      className={`plan-item ${
                        item.completed
                          ? "completed"
                          : ""
                      }`}
                      key={
                        item.id
                      }
                    >
                      <div className="plan-time">
                        <strong>
                          {
                            item.start
                          }
                        </strong>

                        <span>
                          {
                            item.end
                          }
                        </span>
                      </div>

                      <div className="plan-line">
                        <div
                          className={`plan-dot ${
                            item.completed
                              ? "done"
                              : ""
                          }`}
                        >
                          {item.completed && (
                            <CheckCircle2
                              size={
                                13
                              }
                            />
                          )}
                        </div>
                      </div>

                      <div className="plan-details">
                        <span>
                          {
                            item.subject
                          }
                        </span>

                        <strong>
                          {
                            item.task
                          }
                        </strong>

                        <small>
                          {formatHours(
                            getDuration(
                              item.start,
                              item.end
                            )
                          )}{" "}
                          focus session
                        </small>
                      </div>

                      <div className="plan-actions">
                        <button
                          title="Mark complete"
                          className={
                            item.completed
                              ? "plan-action completed-action"
                              : "plan-action"
                          }
                          onClick={() =>
                            togglePlanItem(
                              item.id
                            )
                          }
                        >
                          <CheckCircle2
                            size={
                              15
                            }
                          />
                        </button>

                        <button
                          title="Edit"
                          className="plan-action"
                          onClick={() =>
                            editPlanItem(
                              item
                            )
                          }
                        >
                          <Pencil
                            size={
                              14
                            }
                          />
                        </button>

                        <button
                          title="Delete"
                          className="plan-action delete"
                          onClick={() =>
                            deletePlanItem(
                              item.id
                            )
                          }
                        >
                          <Trash2
                            size={
                              14
                            }
                          />
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div className="plan-note">
              <Sparkles
                size={13}
              />

              Your Time Plan is saved to
              your account.
            </div>
          </div>
        </div>
      )}


      {/* =====================================================
    NOTES MODAL
===================================================== */}

{showNotes && (
  <div
    className="assistant-overlay"
    onClick={() => {
      setShowNotes(false);
      setViewingNote(null);
      resetNoteForm();
    }}
  >
    <div
      className="assistant-panel notes-panel"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        className="close-button"
        onClick={() => {
          setShowNotes(false);
          setViewingNote(null);
          resetNoteForm();
        }}
      >
        <X size={18} />
      </button>

      {/* HEADER */}

      <div className="notes-header">
        <div className="assistant-icon notes-icon">
          <FileText size={25} />
        </div>

        <div>
          <p>THINKSYNC / KNOWLEDGE</p>

          <h3>
            My Notes
          </h3>
        </div>

        <span className="online-label">
          <i />
          NOTES ACTIVE
        </span>
      </div>

      {/* SUMMARY */}

      <div className="notes-summary">
        <div>
          <span>TOTAL NOTES</span>
          <strong>
            {notes.length}
          </strong>
        </div>

        <div>
          <span>PINNED</span>
          <strong>
            {
              notes.filter(
                (note) =>
                  note.pinned
              ).length
            }
          </strong>
        </div>

        <div>
          <span>SUBJECTS</span>
          <strong>
            {Math.max(
              noteSubjects.length -
                1,
              0
            )}
          </strong>
        </div>
      </div>

      {/* SEARCH */}

      <div className="notes-toolbar">
        <div className="notes-search">
          <span>⌕</span>

          <input
            value={noteSearch}
            onChange={(event) =>
              setNoteSearch(
                event.target.value
              )
            }
            placeholder="Search notes, topics or tags..."
          />
        </div>

        <select
          value={noteFilter}
          onChange={(event) =>
            setNoteFilter(
              event.target.value
            )
          }
        >
          {noteSubjects.map(
            (subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject}
              </option>
            )
          )}
        </select>
      </div>

      {/* CREATE / EDIT */}

      <div className="notes-create-box">
        <div className="notes-create-title">
          <Plus size={16} />

          {editingNoteId !== null
            ? "EDIT NOTE"
            : "CREATE NEW NOTE"}
        </div>

        <div className="notes-input-grid">
          <input
            value={noteTitle}
            onChange={(event) =>
              setNoteTitle(
                event.target.value
              )
            }
            placeholder="Note title"
          />

          <input
            value={noteSubject}
            onChange={(event) =>
              setNoteSubject(
                event.target.value
              )
            }
            placeholder="Subject"
          />
        </div>

        <input
          className="notes-tags-input"
          value={noteTags}
          onChange={(event) =>
            setNoteTags(
              event.target.value
            )
          }
          placeholder="Tags — e.g. arrays, important, exam"
        />

        <textarea
          className="notes-content-input"
          value={noteContent}
          onChange={(event) =>
            setNoteContent(
              event.target.value
            )
          }
          placeholder="Write your study notes here..."
        />

        <div className="notes-form-actions">
          <button
            className="notes-save-button"
            onClick={saveNote}
          >
            {editingNoteId !== null
              ? "UPDATE NOTE"
              : "SAVE NOTE"}

            <ArrowUpRight
              size={16}
            />
          </button>

          {editingNoteId !== null && (
            <button
              className="notes-cancel-button"
              onClick={
                resetNoteForm
              }
            >
              CANCEL
            </button>
          )}
        </div>
      </div>

      {/* NOTES LIST */}

      <div className="notes-list">
        {filteredNotes.length ===
        0 ? (
          <div className="empty-notes">
            <div className="empty-notes-icon">
              <FileText size={32} />
            </div>

            <strong>
              {notes.length === 0
                ? "No notes yet"
                : "No matching notes"}
            </strong>

            <span>
              {notes.length === 0
                ? "Create your first study note above."
                : "Try another search or subject."}
            </span>
          </div>
        ) : (
          filteredNotes.map(
            (note) => (
              <div
                className={`note-card ${
                  note.pinned
                    ? "pinned"
                    : ""
                }`}
                key={note.id}
              >
                <div className="note-card-top">
                  <div className="note-card-icon">
                    <FileText
                      size={18}
                    />
                  </div>

                  <div className="note-card-heading">
                    <span>
                      {note.subject}
                    </span>

                    <h4>
                      {note.title}
                    </h4>
                  </div>

                  {note.pinned && (
                    <span className="pin-label">
                      PINNED
                    </span>
                  )}
                </div>

                <p className="note-preview">
                  {note.content.length >
                  180
                    ? `${note.content.slice(
                        0,
                        180
                      )}...`
                    : note.content}
                </p>

                {note.tags.length >
                  0 && (
                  <div className="note-tags">
                    {note.tags.map(
                      (tag) => (
                        <span
                          key={tag}
                        >
                          #{tag}
                        </span>
                      )
                    )}
                  </div>
                )}

                <div className="note-card-footer">
                  <span>
                    UPDATED{" "}
                    {formatNoteDate(
                      note.updatedAt
                    )}
                  </span>

                  <div className="note-actions">
                    <button
                      title="Read"
                      onClick={() =>
                        setViewingNote(
                          note
                        )
                      }
                    >
                      <ArrowUpRight
                        size={14}
                      />
                    </button>

                    <button
                      title={
                        note.pinned
                          ? "Unpin"
                          : "Pin"
                      }
                      onClick={() =>
                        togglePinNote(
                          note.id
                        )
                      }
                    >
                      {note.pinned
                        ? "★"
                        : "☆"}
                    </button>

                    <button
                      title="Edit"
                      onClick={() =>
                        editNote(
                          note
                        )
                      }
                    >
                      <Pencil
                        size={14}
                      />
                    </button>

                    <button
                      title="Delete"
                      className="note-delete"
                      onClick={() =>
                        deleteNote(
                          note.id
                        )
                      }
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>

      <div className="notes-footer">
        <Sparkles size={13} />

        Your notes are automatically
        saved on this device.
      </div>
    </div>
  </div>
)}

{/* =====================================================
    NOTE VIEWER
===================================================== */}

{viewingNote && (
  <div
    className="assistant-overlay note-viewer-overlay"
    onClick={() =>
      setViewingNote(null)
    }
  >
    <div
      className="assistant-panel note-viewer-panel"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        className="close-button"
        onClick={() =>
          setViewingNote(null)
        }
      >
        <X size={18} />
      </button>

      <div className="note-viewer-header">
        <div className="note-viewer-icon">
          <FileText size={25} />
        </div>

        <div>
          <span>
            {viewingNote.subject}
          </span>

          <h2>
            {viewingNote.title}
          </h2>
        </div>
      </div>

      {viewingNote.tags.length >
        0 && (
        <div className="note-viewer-tags">
          {viewingNote.tags.map(
            (tag) => (
              <span key={tag}>
                #{tag}
              </span>
            )
          )}
        </div>
      )}

      <div className="note-viewer-content">
        {viewingNote.content}
      </div>

      <div className="note-viewer-footer">
        <span>
          UPDATED{" "}
          {formatNoteDate(
            viewingNote.updatedAt
          )}
        </span>

        <div>
          <button
            className="viewer-edit-button"
            onClick={() =>
              editNote(
                viewingNote
              )
            }
          >
            <Pencil size={14} />
            EDIT NOTE
          </button>

          <button
            className="viewer-delete-button"
            onClick={() =>
              deleteNote(
                viewingNote.id
              )
            }
          >
            <Trash2 size={14} />
            DELETE
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* =====================================================
   `    QUIZ SETUP
      ===================================================== */}

      {showQuizSetup && (
        <div
          className="assistant-overlay"
          onClick={() =>
            setShowQuizSetup(false)
          }
        >
          <div
            className="assistant-panel quiz-setup-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-button"
              onClick={() =>
                setShowQuizSetup(
                  false
                )
              }
            >
              <X size={18} />
            </button>

            <div className="quiz-setup-header">
              <div className="assistant-icon">
                <BrainCircuit
                  size={27}
                />
              </div>

              <div>
                <p>
                  THINKSYNC AI
                </p>

                <h3>
                  Create Your Quiz
                </h3>
              </div>

              <span className="online-label">
                <i />
                AI READY
              </span>
            </div>

            <div className="quiz-setup-content">
              <p className="quiz-label">
                CHOOSE A SUBJECT
              </p>

              <div className="subject-select-grid">
                {[
                  ...subjects.map((subject) => subject.name),
                  "Custom Topic",
                ].map(
                  (subject) => (
                    <button
                      key={
                        subject
                      }
                      className={
                        selectedSubject ===
                        subject
                          ? "subject-select active"
                          : "subject-select"
                      }
                      onClick={() =>
                        setSelectedSubject(
                          subject ===
                            "Custom Topic"
                            ? ""
                            : subject
                        )
                      }
                    >
                      {
                        subject
                      }
                    </button>
                  )
                )}
              </div>

              <p className="quiz-label">
                OR ENTER YOUR OWN
                TOPIC
              </p>

              <input
                className="quiz-topic-input"
                value={
                  selectedSubject
                }
                onChange={(
                  event
                ) =>
                  setSelectedSubject(
                    event.target
                      .value
                  )
                }
                placeholder="Example: Arrays, Flip-Flops, Calculus..."
              />

              <p className="quiz-label">
                USE YOUR STUDY
                MATERIAL
              </p>

              <label
                className="upload-material-box"
                onClick={(event) => {
                  event.preventDefault();
                  quizMaterialInputRef.current?.click();
                }}
              >
                <Upload
                  size={25}
                />

                <strong>
                  {materialName
                    ? materialName
                    : "Upload Notes or Material"}
                </strong>

                <span>
                  TXT and Markdown
                  files can be
                  read directly
                </span>

                <input
                  ref={quizMaterialInputRef}
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  hidden
                  onChange={handleMaterialUpload}
                />
              </label>

              {materialName && (
                <button
                  className="remove-material"
                  onClick={() => {
                    setMaterialName(
                      ""
                    );

                    setMaterialText(
                      ""
                    );
                  }}
                >
                  <X size={14} />
                  REMOVE MATERIAL
                </button>
              )}

              <p className="quiz-label">
                NUMBER OF
                QUESTIONS
              </p>

              <div className="quiz-choice-row">
                {[5, 10, 15].map(
                  (count) => (
                    <button
                      key={
                        count
                      }
                      className={
                        questionCount ===
                        count
                          ? "quiz-choice active"
                          : "quiz-choice"
                      }
                      onClick={() =>
                        setQuestionCount(
                          count
                        )
                      }
                    >
                      {count}
                    </button>
                  )
                )}
              </div>

              <p className="quiz-label">
                DIFFICULTY
              </p>

              <div className="quiz-choice-row">
                {[
                  "Easy",
                  "Medium",
                  "Hard",
                ].map(
                  (level) => (
                    <button
                      key={
                        level
                      }
                      className={
                        difficulty ===
                        level
                          ? "quiz-choice active"
                          : "quiz-choice"
                      }
                      onClick={() =>
                        setDifficulty(
                          level
                        )
                      }
                    >
                      {level}
                    </button>
                  )
                )}
              </div>

              <button
                className="quiz-generate-button"
                onClick={
                  generateQuiz
                }
                disabled={
                  quizLoading
                }
              >
                {quizLoading
                  ? "GENERATING QUIZ..."
                  : "GENERATE QUIZ"}

                {!quizLoading && (
                  <ArrowUpRight
                    size={18}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          QUIZ
      ===================================================== */}

      {showQuiz && quiz && (
        <div
          className="assistant-overlay"
          onClick={() =>
            setShowQuiz(false)
          }
        >
          <div
            className="assistant-panel quiz-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-button"
              onClick={() =>
                setShowQuiz(
                  false
                )
              }
            >
              <X size={18} />
            </button>

            {!quizFinished ? (
              <>
                <div className="assistant-header">
                  <div className="assistant-icon">
                    <BrainCircuit
                      size={25}
                    />
                  </div>

                  <div>
                    <p>
                      THINKSYNC AI
                    </p>

                    <h3>
                      AI Quiz
                    </h3>
                  </div>

                  <span className="online-label">
                    <i />
                    AI GENERATED
                  </span>
                </div>

                <div className="quiz-info">
                  <span>
                    {quiz.topic ||
                      selectedSubject ||
                      "Study Quiz"}
                  </span>

                  <span>
                    {difficulty.toUpperCase()}
                  </span>
                </div>

                <div className="quiz-progress">
                  <span>
                    QUESTION{" "}
                    {currentQuestion +
                      1}{" "}
                    /{" "}
                    {
                      quiz.questions
                        .length
                    }
                  </span>

                  <div className="quiz-progress-track">
                    <span
                      style={{
                        width: `${
                          ((currentQuestion +
                            1) /
                            quiz
                              .questions
                              .length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="quiz-question">
                  <p>
                    {
                      quiz
                        .questions[
                        currentQuestion
                      ]
                        .question
                    }
                  </p>
                </div>

                <div className="quiz-options">
                  {quiz
                    .questions[
                    currentQuestion
                  ].options.map(
                    (
                      option: string,
                      index: number
                    ) => (
                      <button
                        key={
                          index
                        }
                        className={
                          selectedAnswer ===
                          index
                            ? "quiz-option selected"
                            : "quiz-option"
                        }
                        onClick={() =>
                          setSelectedAnswer(
                            index
                          )
                        }
                      >
                        <span className="option-number">
                          {String.fromCharCode(
                            65 +
                              index
                          )}
                        </span>

                        <span>
                          {
                            option
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>

                <button
                  className="quiz-next-button"
                  disabled={
                    selectedAnswer ===
                    null
                  }
                  onClick={
                    nextQuestion
                  }
                >
                  {currentQuestion <
                  quiz
                    .questions
                    .length -
                    1
                    ? "NEXT QUESTION"
                    : "FINISH QUIZ"}

                  <ArrowUpRight
                    size={17}
                  />
                </button>
              </>
            ) : (
              <div className="quiz-result">
                <div className="quiz-result-icon">
                  <Trophy
                    size={42}
                  />
                </div>

                <p className="eyebrow">
                  QUIZ COMPLETE
                </p>

                <h2>
                  YOUR SCORE
                  <br />

                  <span>
                    {quizScore} /{" "}
                    {
                      quiz
                        .questions
                        .length
                    }
                  </span>
                </h2>

                <p className="quiz-result-text">
                  {quizScore ===
                  quiz
                    .questions
                    .length
                    ? "Perfect score! Outstanding work. 🔥"
                    : quizScore >=
                      quiz
                        .questions
                        .length /
                        2
                    ? "Good job! Keep practicing and you'll improve."
                    : "Keep practicing. Every attempt makes you stronger."}
                </p>

                <div className="quiz-result-actions">
                  <button
                    className="primary-button"
                    onClick={
                      resetQuiz
                    }
                  >
                    TRY AGAIN
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      setShowQuiz(
                        false
                      )
                    }
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          STUDYBUDDY
      ===================================================== */}

      {showAssistant && (
        <div
          className="assistant-overlay"
          onClick={() =>
            setShowAssistant(
              false
            )
          }
        >
          <div
            className="assistant-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-button"
              onClick={() =>
                setShowAssistant(
                  false
                )
              }
            >
              <X size={18} />
            </button>

            <div className="assistant-header">
              <div className="assistant-icon">
                <BrainCircuit
                  size={25}
                />
              </div>

              <div>
                <p>
                  THINKSYNC AI
                </p>

                <h3>
                  StudyBuddy
                </h3>
              </div>

              <span className="online-label">
                <i />
                ONLINE
              </span>
            </div>

            {messages.length ===
              0 && (
              <div className="assistant-message">
                <div className="assistant-avatar">
                  ✦
                </div>

                <div>
                  <span>
                    STUDYBUDDY
                  </span>

                  <p>
                    Hi! I&apos;m ready
                    to help you
                    learn. Ask me
                    about a topic,
                    create a quiz,
                    or make a study
                    plan.
                  </p>
                </div>
              </div>
            )}

            <div className="chat-messages">
              {messages.map(
                (msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      msg.role ===
                      "user"
                        ? "user-message"
                        : "ai-message"
                    }`}
                  >
                    <div className="chat-message-label">
                      {msg.role ===
                      "user"
                        ? "YOU"
                        : "STUDYBUDDY"}
                    </div>

                    <div className="chat-message-content">
                      {
                        msg.content
                      }
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="chat-message ai-message">
                  <div className="chat-message-label">
                    STUDYBUDDY
                  </div>

                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <div className="suggestions">
              <button
                onClick={() =>
                  sendSuggestion(
                    "Explain arrays simply"
                  )
                }
              >
                Explain arrays
                simply
              </button>

              <button
                onClick={() =>
                  sendSuggestion(
                    "Create a DSA quiz"
                  )
                }
              >
                Create a DSA quiz
              </button>

              <button
                onClick={() =>
                  sendSuggestion(
                    "Make me a study plan"
                  )
                }
              >
                Make me a study plan
              </button>
            </div>

            <div className="chat-input">
              <input
                id="studybuddy-input"
                value={message}
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask StudyBuddy anything..."
                disabled={loading}
              />

              <button
                onClick={
                  sendMessage
                }
                disabled={
                  loading ||
                  !message.trim()
                }
              >
                {loading ? (
                  <span className="send-loader" />
                ) : (
                  <ArrowUpRight
                    size={18}
                  />
                )}
              </button>
            </div>

            <small className="ai-note">
              StudyBuddy AI ·
              Powered by your
              configured AI model
            </small>
          </div>
        </div>
      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        .subject-card {
  position: relative;
}

.subject-actions {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 20;
  display: flex;
  gap: 6px;
}

.subject-actions button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 7px;
  background: #FFFFFF;
  color: #64748B;
  cursor: pointer;
}

.subject-actions button:hover {
  color: #0284C7;
  border-color: #0284C7;
}

.subject-actions button:last-child:hover {
  color: #DC2626;
  border-color: #DC2626;
}

        .study-page {
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          background: #F8FAFC;
          color: #0F172A;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* =====================================================
           INTRO
        ===================================================== */

        .intro-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          background: #0F172A;
          color: white;
          animation: introFade 6.2s
            forwards;
        }

        .intro-grid {
          position: absolute;
          inset: 0;
          opacity: 0.16;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.08)
                1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.08)
                1px,
              transparent 1px
            );
          background-size: 70px 70px;
        }

        .intro-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(130px);
          opacity: 0.18;
        }

        .intro-glow-one {
          left: -250px;
          top: 20%;
          background: #0284C7;
        }

        .intro-glow-two {
          right: -250px;
          bottom: 0;
          background: #0284C7;
        }

        .intro-top {
          position: absolute;
          top: 30px;
          left: 4vw;
          color: #94A3B8;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.18em;
        }

        .intro-logo {
          position: absolute;
          top: 27px;
          left: 50%;
          display: flex;
          align-items: center;
          gap: 12px;
          transform: translateX(-50%);
        }

        .logo-mark {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border: 1px solid #0284C7;
          border-radius: 13px;
          color: #38BDF8;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
          box-shadow:
            0 0 25px
              rgba(
                2,
                132,
                199,
                0.3
              ),
            inset 0 0 20px
              rgba(
                2,
                132,
                199,
                0.08
              );
        }

        .logo-name {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .logo-name span {
          color: #38BDF8;
        }

        .intro-title {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 5;
          text-align: center;
          transform: translate(
            -50%,
            -50%
          );
        }

        .intro-title p {
          margin: 0 0 15px;
          color: #38BDF8;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.25em;
        }

        .intro-title h1 {
          margin: 0;
          font-size: clamp(
            60px,
            10vw,
            145px
          );
          line-height: 0.78;
          letter-spacing: -0.1em;
          font-weight: 900;
        }

        .intro-title h1 span {
          color: transparent;
          -webkit-text-stroke: 1px
            #7DD3FC;
          text-shadow:
            0 0 35px
              rgba(
                2,
                132,
                199,
                0.25
              );
        }

        /* ORB */

        .intro-orb {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 330px;
          height: 330px;
          transform: translate(
            -50%,
            -50%
          );
        }

        .intro-orb-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 105px;
          height: 105px;
          display: grid;
          place-items: center;
          transform: translate(
            -50%,
            -50%
          );
          border-radius: 50%;
          color: #F0F9FF;
          background:
            radial-gradient(
              circle at 35% 25%,
              #7DD3FC,
              #0284C7 45%,
              #0F172A 90%
            );
          box-shadow:
            0 0 35px
              rgba(
                2,
                132,
                199,
                0.7
              ),
            0 0 100px
              rgba(
                2,
                132,
                199,
                0.35
              );
          animation: coreFloat 4s
            ease-in-out infinite;
        }

        .intro-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid
            rgba(
              125,
              211,
              252,
              0.3
            );
          border-radius: 50%;
          transform: translate(
            -50%,
            -50%
          );
        }

        .orbit-one {
          width: 240px;
          height: 100px;
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(-22deg);
          animation: orbitOne 7s
            linear infinite;
        }

        .orbit-two {
          width: 290px;
          height: 125px;
          border-color: rgba(
            2,
            132,
            199,
            0.28
          );
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(48deg);
          animation: orbitTwo 10s
            linear infinite;
        }

        .orbit-three {
          width: 330px;
          height: 145px;
          border-color: rgba(
            125,
            211,
            252,
            0.15
          );
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(-65deg);
          animation: orbitThree 14s
            linear infinite;
        }

        /* FLOATING CARDS */

        .floating-card {
          position: absolute;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 190px;
          padding: 13px 17px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );
          border-radius: 18px;
          background: rgba(
            15,
            23,
            42,
            0.72
          );
          backdrop-filter: blur(
            18px
          );
          box-shadow:
            0 20px 50px
              rgba(
                0,
                0,
                0,
                0.3
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                0.06
              );
        }

        .floating-card strong,
        .floating-card span {
          display: block;
        }

        .floating-card strong {
          color: #fff;
          font-size: 11px;
          letter-spacing: 0.12em;
        }

        .floating-card span {
          margin-top: 5px;
          color: #94A3B8;
          font-size: 9px;
        }

        .floating-image {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.45
            );
          border-radius: 13px;
          color: #38BDF8;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
        }

        .card-one {
          left: 9%;
          top: 25%;
          transform: rotate(
            -8deg
          );
          animation:
            cardOne 1.1s
              1.3s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              forwards,
            floating 5s
              2.4s
              ease-in-out
              infinite;
        }

        .card-two {
          right: 8%;
          top: 22%;
          transform: rotate(8deg);
          animation:
            cardTwo 1.1s
              1.6s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              forwards,
            floatingTwo 5s
              2.7s
              ease-in-out
              infinite;
        }

        .card-three {
          left: 7%;
          bottom: 22%;
          transform: rotate(7deg);
          animation:
            cardThree 1.1s
              1.9s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              forwards,
            floating 5.5s
              3s
              ease-in-out
              infinite;
        }

        .card-four {
          right: 8%;
          bottom: 20%;
          transform: rotate(
            -7deg
          );
          animation:
            cardFour 1.1s
              2.2s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              )
              forwards,
            floatingTwo 5.5s
              3.2s
              ease-in-out
              infinite;
        }

        .intro-bottom {
          position: absolute;
          left: 4vw;
          right: 4vw;
          bottom: 25px;
          display: flex;
          justify-content: space-between;
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.1em;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .main-content {
          min-height: 100vh;
          opacity: 0;
          transform: scale(1.03);
          filter: blur(10px);
          transition:
            opacity 0.9s ease,
            transform 1.1s
              cubic-bezier(
                0.16,
                1,
                0.3,
                1
              ),
            filter 0.9s ease;
          background: #F8FAFC;
        }

        .show-content {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
        }

        .background-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image:
            linear-gradient(
              rgba(
                15,
                23,
                42,
                0.05
              )
                1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(
                15,
                23,
                42,
                0.05
              )
                1px,
              transparent 1px
            );
          background-size: 70px 70px;
        }

        .background-glow {
          position: fixed;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: 0.06;
          pointer-events: none;
        }

        .glow-cyan {
          left: -220px;
          top: 25%;
          background: #0284C7;
        }

        .glow-violet {
          right: -220px;
          top: 15%;
          background: #64748B;
        }

        .glow-pink {
          left: 40%;
          bottom: -320px;
          background: #64748B;
          opacity: 0.04;
        }

        /* TOPBAR */

        .topbar {
          position: relative;
          z-index: 10;
          height: 78px;
          padding: 0 4vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          background: rgba(
            255,
            255,
            255,
            0.85
          );
          backdrop-filter: blur(
            20px
          );
        }

        .brand-area {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .back-button {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.14
            );
          border-radius: 10px;
          color: #0F172A;
          text-decoration: none;
        }

        .back-button:hover {
          color: #0284C7;
          border-color: rgba(
            2,
            132,
            199,
            0.5
          );
          transform: translateX(
            -3px
          );
        }

        .brand {
          color: #0F172A;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .brand span {
          color: #0284C7;
        }

        .separator {
          width: 1px;
          height: 24px;
          background: rgba(
            15,
            23,
            42,
            0.14
          );
        }

        .module-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748B;
          font: 10px
            "Courier New",
            monospace;
          letter-spacing: 0.16em;
        }

        .module-name svg {
          color: #0284C7;
        }

        .top-status {
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.12em;
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 7px;
          border-radius: 50%;
          background: #0284C7;
          box-shadow: 0 0 12px
            #0284C7;
        }

        /* CONTENT */

        .page-content {
          position: relative;
          z-index: 2;
          max-width: 1450px;
          margin: auto;
        }

        .hero {
          position: relative;
          min-height: 590px;
          padding: 110px 4vw 85px;
          display: flex;
          align-items: center;
          overflow: hidden;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .hero-copy {
          position: relative;
          z-index: 5;
          max-width: 650px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 20px;
          color: #0284C7;
          font: 10px
            "Courier New",
            monospace;
          letter-spacing: 0.17em;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(
            70px,
            9vw,
            138px
          );
          line-height: 0.78;
          letter-spacing: -0.09em;
          font-weight: 900;
          color: #0F172A;
        }

        .hero h1 span {
          color: transparent;
          -webkit-text-stroke: 1px
            #0284C7;
        }

        .hero-description {
          max-width: 470px;
          margin: 35px 0 0;
          color: #64748B;
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }

        .primary-button,
        .secondary-button {
          height: 48px;
          padding: 0 19px;
          display: flex;
          align-items: center;
          gap: 9px;
          border-radius: 10px;
          font: 10px
            "Courier New",
            monospace;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: 0.3s;
        }

        .primary-button {
          border: 1px solid #0284C7;
          background: #0284C7;
          color: white;
        }

        .primary-button:hover {
          transform: translateY(
            -3px
          );
        }

        .secondary-button {
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.18
            );
          background: #fff;
          color: #0F172A;
        }

        /* ORB */

        .ai-orb-area {
          position: absolute;
          right: 7%;
          top: 50%;
          width: 440px;
          height: 440px;
          transform: translateY(
            -50%
          );
        }

        .ai-orb {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 145px;
          height: 145px;
          transform: translate(
            -50%,
            -50%
          );
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 35% 30%,
              #E0F2FE,
              #0284C7 45%,
              #0F172A 90%
            );
          box-shadow:
            0 0 35px
              rgba(
                2,
                132,
                199,
                0.5
              ),
            0 0 90px
              rgba(
                2,
                132,
                199,
                0.25
              );
          animation: orbFloat 4s
            ease-in-out infinite;
        }

        .orb-inner {
          width: 100px;
          height: 100px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: white;
          background: rgba(
            15,
            23,
            42,
            0.45
          );
        }

        .orb-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.35
            );
          border-radius: 50%;
        }

        .orbit-a {
          width: 290px;
          height: 120px;
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(-22deg);
        }

        .orbit-b {
          width: 340px;
          height: 145px;
          border-color: rgba(
            100,
            116,
            139,
            0.3
          );
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(42deg);
        }

        .orbit-c {
          width: 405px;
          height: 175px;
          border-color: rgba(
            125,
            211,
            252,
            0.2
          );
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(-68deg);
        }

        .orb-particle {
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #38BDF8;
          box-shadow: 0 0 18px
            #0284C7;
        }

        .particle-one {
          left: 18%;
          top: 43%;
        }

        .particle-two {
          right: 16%;
          top: 28%;
          background: #64748B;
        }

        .particle-three {
          right: 23%;
          bottom: 22%;
          background: #0284C7;
        }

        .orb-label {
          position: absolute;
          left: 50%;
          bottom: 22px;
          transform: translateX(
            -50%
          );
          text-align: center;
          font-family:
            "Courier New",
            monospace;
        }

        .orb-label span,
        .orb-label small {
          display: block;
        }

        .orb-label span {
          color: white;
          font-size: 10px;
          letter-spacing: 0.2em;
        }

        .orb-label small {
          margin-top: 6px;
          color: rgba(255,255,255,0.65);
          font-size: 8px;
          letter-spacing: 0.15em;
        }

        /* =====================================================
           TIME PLAN STRIP
        ===================================================== */

        .time-plan-strip {
          margin: 0;
          padding: 24px 4vw;
          display: flex;
          align-items: center;
          gap: 30px;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          background: #F1F5F9;
        }

        .time-plan-main {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 280px;
        }

        .time-plan-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.4
            );
          border-radius: 12px;
          color: #0284C7;
          background: #fff;
        }

        .time-plan-main p {
          margin: 0;
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
          letter-spacing: 0.13em;
        }

        .time-plan-main h3 {
          margin: 6px 0 0;
          font-size: 14px;
          color: #0F172A;
        }

        .time-plan-stats {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 10px;
        }

        .time-plan-stats div {
          padding-left: 18px;
          border-left: 1px solid
            rgba(
              15,
              23,
              42,
              0.12
            );
        }

        .time-plan-stats span,
        .time-plan-stats strong {
          display: block;
          font-family:
            "Courier New",
            monospace;
        }

        .time-plan-stats span {
          color: #64748B;
          font-size: 8px;
        }

        .time-plan-stats strong {
          margin-top: 5px;
          color: #0F172A;
          font-size: 14px;
        }

        .time-plan-open {
          height: 43px;
          padding: 0 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #0284C7;
          border-radius: 9px;
          background: #0284C7;
          color: #fff;
          font: 9px
            "Courier New",
            monospace;
          cursor: pointer;
          white-space: nowrap;
        }

        .time-plan-open:hover {
          opacity: 0.9;
        }

        /* STATS */

        .stats {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .stat-card {
          position: relative;
          min-height: 100px;
          padding: 24px 30px;
          display: flex;
          align-items: center;
          gap: 14px;
          border-right: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          background: #fff;
        }

        .stat-card:last-child {
          border-right: 0;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid;
          border-radius: 50%;
        }

        .stat-icon.cyan {
          color: #0284C7;
          border-color: rgba(
            2,
            132,
            199,
            0.4
          );
        }

        .stat-icon.orange {
          color: #0284C7;
          border-color: rgba(
            2,
            132,
            199,
            0.4
          );
        }

        .stat-icon.violet {
          color: #64748B;
          border-color: rgba(
            100,
            116,
            139,
            0.4
          );
        }

        .stat-icon.green {
          color: #64748B;
          border-color: rgba(
            100,
            116,
            139,
            0.4
          );
        }

        .stat-card small,
        .stat-card strong {
          display: block;
          font-family:
            "Courier New",
            monospace;
        }

        .stat-card small {
          color: #64748B;
          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .stat-card strong {
          margin-top: 7px;
          color: #0F172A;
          font-size: 15px;
        }

        .stat-progress {
          position: absolute;
          left: 30px;
          right: 30px;
          bottom: 0;
          height: 2px;
          background: rgba(
            15,
            23,
            42,
            0.06
          );
        }

        .stat-progress span {
          display: block;
          height: 100%;
          background: #0284C7;
        }

        /* SECTIONS */

        .section {
          padding: 110px 4vw;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .section-heading h2 {
          margin: 0;
          font-size: clamp(
            40px,
            5vw,
            72px
          );
          line-height: 0.9;
          letter-spacing: -0.07em;
          color: #0F172A;
        }

        .section-heading h2 span {
          color: transparent;
          -webkit-text-stroke: 1px
            #64748B;
        }

        .split {
          align-items: center;
        }

        .view-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 15px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 9px;
          background: #fff;
          color: #0F172A;
          font: 9px
            "Courier New",
            monospace;
          cursor: pointer;
        }

        /* ACTIONS */

        .action-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 13px;
          margin-top: 45px;
        }

        .action-card {
          min-height: 225px;
          padding: 21px;
          position: relative;
          overflow: hidden;
          text-align: left;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.12
            );
          border-radius: 15px;
          background: #fff;
          color: #0F172A;
          cursor: pointer;
          transition: 0.35s;
        }

        .action-card:hover {
          transform: translateY(
            -7px
          );
          border-color: #0284C7;
        }

        .action-top {
          position: relative;
          display: flex;
          justify-content: space-between;
          color: #64748B;
        }

        .action-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.35
            );
          border-radius: 12px;
          color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.06
          );
        }

        .violet .action-icon {
          color: #0284C7;
        }

        .pink .action-icon {
          color: #0284C7;
        }

        .green .action-icon {
          color: #0284C7;
        }

        .action-content {
          position: absolute;
          left: 21px;
          right: 21px;
          bottom: 22px;
        }

        .action-content h3 {
          margin: 0;
          font-size: 19px;
          color: #0F172A;
        }

        .action-content p {
          max-width: 190px;
          margin: 8px 0 0;
          color: #64748B;
          font-size: 11px;
          line-height: 1.55;
        }

        /* SUBJECTS */

        .subject-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 13px;
          margin-top: 45px;
        }

        .subject-empty-state {
          min-height: 405px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 30px;
          border: 1px dashed rgba(15, 23, 42, 0.18);
          background: #fff;
          color: #64748B;
          text-align: center;
        }

        .subject-empty-state strong {
          color: #0F172A;
          font-size: 18px;
        }

        .subject-empty-state span {
          max-width: 330px;
          font-size: 12px;
          line-height: 1.6;
        }

        .subject-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
        }

        .subject-modal {
          width: min(520px, 100%);
          padding: 30px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.25);
        }

        .subject-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .subject-modal-header h3 {
          margin: 0;
          color: #0F172A;
          font-size: 30px;
          letter-spacing: -0.04em;
        }

        .modal-close {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(15, 23, 42, 0.16);
          background: transparent;
          color: #0F172A;
          cursor: pointer;
        }

        .subject-modal label {
          display: block;
          margin-top: 18px;
          color: #64748B;
          font: 10px "Courier New", monospace;
          letter-spacing: 0.1em;
        }

        .subject-modal input {
          width: 100%;
          margin-top: 9px;
          padding: 13px 14px;
          border: 1px solid rgba(15, 23, 42, 0.16);
          outline: none;
          background: #F8FAFC;
          color: #0F172A;
          font: 13px Arial, sans-serif;
        }

        .subject-modal input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.12);
        }

        .subject-modal label small {
          display: block;
          margin-top: 7px;
          color: #64748B;
          font: 10px Arial, sans-serif;
          letter-spacing: 0;
        }

        .edit-topics-block {
          margin-top: 18px;
        }

        .edit-topics-label {
          margin: 0 0 9px;
          color: #64748B;
          font: 10px "Courier New", monospace;
          letter-spacing: 0.1em;
        }

        .edit-topics-loading,
        .edit-topics-empty {
          padding: 14px;
          border: 1px dashed rgba(15, 23, 42, 0.16);
          border-radius: 8px;
          color: #64748B;
          font-size: 12px;
          text-align: center;
        }

        .edit-topics-list {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding-right: 4px;
        }

        .edit-topics-list::-webkit-scrollbar {
          width: 5px;
        }

        .edit-topics-list::-webkit-scrollbar-thumb {
          background: rgba(2, 132, 199, 0.3);
          border-radius: 10px;
        }

        .edit-topic-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          border-radius: 8px;
          background: #F8FAFC;
        }

        .edit-topic-row span {
          flex: 1;
          color: #0F172A;
          font-size: 13px;
        }

        .edit-topic-row span.learned {
          color: #0284C7;
          text-decoration: line-through;
          text-decoration-color: rgba(2, 132, 199, 0.4);
        }

        .edit-topic-checkbox {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(15, 23, 42, 0.25);
          border-radius: 5px;
          background: transparent;
          color: transparent;
          cursor: pointer;
        }

        .edit-topic-checkbox.checked {
          border-color: #0284C7;
          background: rgba(2, 132, 199, 0.14);
          color: #0284C7;
        }

        .edit-topic-remove {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 6px;
          background: transparent;
          color: #64748B;
          cursor: pointer;
        }

        .edit-topic-remove:hover {
          color: #DC2626;
          border-color: rgba(220, 38, 38, 0.4);
        }

        .edit-topic-add-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .edit-topic-add-row input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.16);
          border-radius: 6px;
          outline: none;
          background: #F8FAFC;
          color: #0F172A;
          font-size: 12px;
        }

        .edit-topic-add-row input:focus {
          border-color: #0284C7;
        }

        .edit-topic-add-row button {
          width: 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(2, 132, 199, 0.4);
          border-radius: 6px;
          background: rgba(2, 132, 199, 0.08);
          color: #0284C7;
          cursor: pointer;
        }

        .edit-topics-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(15, 23, 42, 0.1);
          color: #64748B;
          font: 10px "Courier New", monospace;
        }

        .edit-topics-summary span:last-child {
          color: #0284C7;
        }

        .subject-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 28px;
        }

        .subject-modal-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .subject-modal-actions .primary-button,
        .subject-modal-actions .secondary-button {
          width: auto;
        }

        .subject-modal-actions .primary-button {
          padding: 12px 16px;
        }

        .subject-modal-actions .secondary-button {
          padding: 12px 16px;
        }

        .subject-card,
        .add-subject {
          position: relative;
          min-height: 300px;
          padding: 22px;
          overflow: hidden;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.12
            );
          border-radius: 15px;
          background: #fff;
        }

        .subject-top {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .subject-top > span {
          color: #64748B;
          font: 10px
            "Courier New",
            monospace;
          letter-spacing: 0.15em;
        }

        .subject-circle {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.35
            );
          border-radius: 50%;
          color: #0284C7;
          font: 10px
            "Courier New",
            monospace;
        }

        .subject-card h3 {
          position: relative;
          margin: 58px 0 9px;
          font-size: 21px;
          color: #0F172A;
        }

        .subject-card p {
          position: relative;
          min-height: 34px;
          margin: 0;
          color: #64748B;
          font-size: 10px;
          line-height: 1.6;
        }

        .progress-track {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 65px;
          height: 3px;
          background: rgba(
            15,
            23,
            42,
            0.08
          );
        }

        .progress-track span {
          display: block;
          height: 100%;
          background: #0284C7;
        }

        .subject-footer {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          display: flex;
          justify-content: space-between;
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
        }

        .add-subject {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          border-style: dashed;
        }

        .add-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          border: 1px dashed
            rgba(
              2,
              132,
              199,
              0.4
            );
          border-radius: 50%;
          color: #0284C7;
        }

        .add-subject strong {
          font: 10px
            "Courier New",
            monospace;
          letter-spacing: 0.12em;
          color: #0F172A;
        }

        .add-subject span {
          margin-top: 9px;
          text-align: center;
          font-size: 10px;
          line-height: 1.5;
        }

        /* INSIGHT */

        .ai-insight {
          position: relative;
          min-height: 430px;
          margin: 0 4vw 110px;
          padding: 55px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius: 22px;
          background: #0F172A;
        }

        .insight-content {
          position: relative;
          z-index: 2;
          max-width: 550px;
        }

        .insight-content h2 {
          margin: 0;
          font-size: clamp(
            45px,
            5vw,
            75px
          );
          line-height: 0.88;
          color: #fff;
        }

        .insight-content h2 span {
          color: #38BDF8;
        }

        .insight-content
          > p:not(.eyebrow) {
          max-width: 470px;
          margin: 25px 0;
          color: #94A3B8;
          font-size: 12px;
          line-height: 1.75;
        }

        .insight-button {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 16px;
          border: 1px solid #0284C7;
          border-radius: 9px;
          background: #0284C7;
          color: white;
          font: 9px
            "Courier New",
            monospace;
          cursor: pointer;
        }

        .insight-metrics {
          position: relative;
          z-index: 2;
          width: 240px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-metrics div {
          padding: 15px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          border-radius: 10px;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
        }

        .insight-metrics span,
        .insight-metrics strong {
          display: block;
          font-family:
            "Courier New",
            monospace;
        }

        .insight-metrics span {
          color: #94A3B8;
          font-size: 8px;
        }

        .insight-metrics strong {
          margin-top: 5px;
          color: #fff;
          font-size: 17px;
        }

        .insight-orb {
          position: absolute;
          width: 300px;
          height: 300px;
          right: 250px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(
                2,
                132,
                199,
                0.25
              ),
              transparent 70%
            );
          filter: blur(25px);
        }

        /* ACTIVITY */

        .activity-section {
          padding-top: 20px;
        }

        .activity-list {
          margin-top: 40px;
          border-top: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .activity-row {
          min-height: 82px;
          display: flex;
          align-items: center;
          gap: 17px;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.3
            );
          border-radius: 10px;
          color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.05
          );
        }

        .activity-main {
          flex: 1;
        }

        .activity-main strong,
        .activity-main span {
          display: block;
        }

        .activity-main strong {
          font-size: 13px;
          color: #0F172A;
        }

        .activity-main span {
          margin-top: 5px;
          color: #64748B;
          font-size: 10px;
        }

        .activity-time {
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
        }

        .activity-arrow {
          color: #64748B;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          padding: 30px 4vw;
          border-top: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.08em;
        }

        /* =====================================================
           MODALS
        ===================================================== */

        .assistant-overlay {
          position: fixed;
          z-index: 100;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 30px;
          background: rgba(
            15,
            23,
            42,
            0.6
          );
          backdrop-filter: blur(
            18px
          );
        }

        .assistant-panel {
          position: relative;
          width: min(
            900px,
            92vw
          );
          height: min(
            720px,
            88vh
          );
          min-height: 600px;
          padding: 38px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          border-radius: 26px;
          background: #fff;
          box-shadow:
            0 40px 120px
              rgba(
                15,
                23,
                42,
                0.35
              );
          animation: panelIn
            0.35s ease-out;
          display: flex;
          flex-direction: column;
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 10px;
          background: #F8FAFC;
          color: #0F172A;
          cursor: pointer;
          z-index: 5;
        }

        .assistant-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 28px;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .assistant-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.5
            );
          border-radius: 16px;
          color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.06
          );
        }

        .assistant-header p,
        .quiz-setup-header p {
          margin: 0;
          color: #0284C7;
          font: 8px
            "Courier New",
            monospace;
          letter-spacing: 0.15em;
        }

        .assistant-header h3,
        .quiz-setup-header h3 {
          margin: 5px 0 0;
          font-size: 25px;
          color: #0F172A;
        }

        .online-label {
          margin-left: auto;
          color: #0284C7;
          font: 8px
            "Courier New",
            monospace;
        }

        .online-label i {
          display: inline-block;
          width: 5px;
          height: 5px;
          margin-right: 5px;
          border-radius: 50%;
          background: #0284C7;
        }

        /* =====================================================
           TIME PLAN MODAL
        ===================================================== */

        .time-plan-panel {
          width: min(
            1000px,
            94vw
          );
          height: min(
            850px,
            92vh
          );
          min-height: 0;
          overflow-y: auto;
        }

        .time-plan-panel::-webkit-scrollbar {
          width: 5px;
        }

        .time-plan-panel::-webkit-scrollbar-thumb {
          background: rgba(
            2,
            132,
            199,
            0.3
          );
          border-radius: 10px;
        }

        .plan-summary {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          gap: 10px;
          margin-top: 22px;
        }

        .plan-summary div {
          padding: 15px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          border-radius: 11px;
          background: #F8FAFC;
        }

        .plan-summary span,
        .plan-summary strong {
          display: block;
          font-family:
            "Courier New",
            monospace;
        }

        .plan-summary span {
          color: #64748B;
          font-size: 8px;
        }

        .plan-summary strong {
          margin-top: 7px;
          color: #0F172A;
          font-size: 17px;
        }

        .plan-progress-large {
          margin-top: 18px;
        }

        .plan-progress-large > div:first-child {
          display: flex;
          justify-content: space-between;
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
        }

        .plan-progress-large strong {
          color: #0284C7;
        }

        .plan-progress-track {
          height: 4px;
          margin-top: 9px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(
            15,
            23,
            42,
            0.08
          );
        }

        .plan-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #0284C7;
          transition: width
            0.35s ease;
        }

        .plan-form {
          margin-top: 22px;
          padding: 18px;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.16
            );
          border-radius: 14px;
          background: rgba(
            2,
            132,
            199,
            0.03
          );
        }

        .plan-form-title {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #0284C7;
          font: 9px
            "Courier New",
            monospace;
          letter-spacing: 0.12em;
        }

        .plan-form-grid {
          display: grid;
          grid-template-columns:
            1fr 1.5fr
            0.8fr 0.8fr;
          gap: 10px;
          margin-top: 13px;
        }

        .plan-form-grid input {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          outline: none;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 9px;
          background: #fff;
          color: #0F172A;
          font-size: 12px;
        }

        .plan-form-grid input:focus {
          border-color: #0284C7;
        }

        .plan-form-grid label {
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
        }

        .plan-form-grid label input {
          margin-top: 5px;
        }

        .plan-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .plan-save-button,
        .plan-cancel-button {
          height: 43px;
          padding: 0 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9px;
          cursor: pointer;
          font: 9px
            "Courier New",
            monospace;
        }

        .plan-save-button {
          flex: 1;
          border: 1px solid #0284C7;
          background: #0284C7;
          color: white;
        }

        .plan-cancel-button {
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          background: #fff;
          color: #64748B;
        }

        .plan-timeline {
          margin-top: 22px;
          border-top: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .plan-item {
          min-height: 92px;
          display: grid;
          grid-template-columns:
            80px 28px 1fr
            auto;
          align-items: center;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
          transition: 0.2s;
        }

        .plan-item:hover {
          background: #F8FAFC;
        }

        .plan-item.completed {
          opacity: 0.62;
        }

        .plan-time {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family:
            "Courier New",
            monospace;
        }

        .plan-time strong {
          color: #0F172A;
          font-size: 12px;
        }

        .plan-time span {
          color: #64748B;
          font-size: 9px;
        }

        .plan-line {
          position: relative;
          height: 100%;
          display: grid;
          place-items: center;
        }

        .plan-line::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(
            15,
            23,
            42,
            0.12
          );
        }

        .plan-item:last-child
          .plan-line::before {
          bottom: 50%;
        }

        .plan-dot {
          position: relative;
          z-index: 2;
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.45
            );
          border-radius: 50%;
          background: #fff;
          color: #0284C7;
        }

        .plan-dot.done {
          border-color: #0284C7;
          background: #0284C7;
          color: #fff;
        }

        .plan-details {
          padding: 16px 12px;
        }

        .plan-details span,
        .plan-details strong,
        .plan-details small {
          display: block;
        }

        .plan-details span {
          color: #0284C7;
          font: 8px
            "Courier New",
            monospace;
          letter-spacing: 0.12em;
        }

        .plan-details strong {
          margin-top: 5px;
          color: #0F172A;
          font-size: 14px;
        }

        .plan-item.completed
          .plan-details strong {
          text-decoration: line-through;
          text-decoration-color: rgba(
            2,
            132,
            199,
            0.45
          );
        }

        .plan-details small {
          margin-top: 5px;
          color: #64748B;
          font-size: 9px;
        }

        .plan-actions {
          display: flex;
          gap: 6px;
          padding-right: 4px;
        }

        .plan-action {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.14
            );
          border-radius: 8px;
          background: #fff;
          color: #64748B;
          cursor: pointer;
        }

        .plan-action:hover {
          color: #0F172A;
          border-color: #0284C7;
        }

        .plan-action.completed-action {
          color: #0284C7;
          border-color: rgba(
            2,
            132,
            199,
            0.4
          );
        }

        .plan-action.delete:hover {
          color: #DC2626;
          border-color: rgba(
            220,
            38,
            38,
            0.4
          );
        }

        .empty-plan {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748B;
          text-align: center;
        }

        .empty-plan strong {
          color: #0F172A;
          font-size: 14px;
        }

        .empty-plan span {
          font-size: 10px;
        }

        .plan-note {
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
        }
/* =====================================================
   NOTES
===================================================== */

.notes-panel {
  width: min(1050px, 94vw);
  height: min(900px, 94vh);
  min-height: 0;
  overflow-y: auto;
}

.notes-panel::-webkit-scrollbar {
  width: 5px;
}

.notes-panel::-webkit-scrollbar-thumb {
  background: rgba(
    2,
    132,
    199,
    0.3
  );
  border-radius: 10px;
}

.notes-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 25px;
  border-bottom: 1px solid
    rgba(
      15,
      23,
      42,
      0.1
    );
}

.notes-header p {
  margin: 0;
  color: #0284C7;
  font: 8px
    "Courier New",
    monospace;
  letter-spacing: 0.15em;
}

.notes-header h3 {
  margin: 5px 0 0;
  font-size: 27px;
  color: #0F172A;
}

.notes-icon {
  color: #0284C7;
}

/* SUMMARY */

.notes-summary {
  display: grid;
  grid-template-columns: repeat(
    3,
    1fr
  );
  gap: 10px;
  margin-top: 20px;
}

.notes-summary div {
  padding: 15px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.1
    );
  border-radius: 11px;
  background: #F8FAFC;
}

.notes-summary span,
.notes-summary strong {
  display: block;
  font-family:
    "Courier New",
    monospace;
}

.notes-summary span {
  color: #64748B;
  font-size: 8px;
}

.notes-summary strong {
  margin-top: 7px;
  color: #0F172A;
  font-size: 18px;
}

/* TOOLBAR */

.notes-toolbar {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.notes-search {
  flex: 1;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.16
    );
  border-radius: 9px;
  background: #fff;
}

.notes-search span {
  color: #0284C7;
  font-size: 20px;
}

.notes-search input {
  width: 100%;
  outline: none;
  border: 0;
  background: transparent;
  color: #0F172A;
  font-size: 12px;
}

.notes-search input::placeholder {
  color: #94A3B8;
}

.notes-toolbar select {
  width: 190px;
  padding: 0 12px;
  outline: none;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.16
    );
  border-radius: 9px;
  background: #fff;
  color: #0F172A;
}

/* CREATE */

.notes-create-box {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.16
    );
  border-radius: 14px;
  background: rgba(
    2,
    132,
    199,
    0.03
  );
}

.notes-create-title {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #0284C7;
  font: 9px
    "Courier New",
    monospace;
  letter-spacing: 0.12em;
}

.notes-input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 13px;
}

.notes-input-grid input,
.notes-tags-input,
.notes-content-input {
  width: 100%;
  outline: none;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.16
    );
  border-radius: 9px;
  background: #fff;
  color: #0F172A;
  font-size: 12px;
}

.notes-input-grid input,
.notes-tags-input {
  height: 45px;
  padding: 0 13px;
}

.notes-tags-input {
  margin-top: 10px;
}

.notes-content-input {
  min-height: 150px;
  margin-top: 10px;
  padding: 13px;
  resize: vertical;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  line-height: 1.65;
}

.notes-input-grid input:focus,
.notes-tags-input:focus,
.notes-content-input:focus {
  border-color: #0284C7;
}

.notes-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.notes-save-button,
.notes-cancel-button {
  height: 43px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9px;
  cursor: pointer;
  font: 9px
    "Courier New",
    monospace;
}

.notes-save-button {
  flex: 1;
  border: 1px solid #0284C7;
  background: #0284C7;
  color: white;
}

.notes-cancel-button {
  padding: 0 18px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.16
    );
  background: #fff;
  color: #64748B;
}

/* NOTES LIST */

.notes-list {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.note-card {
  position: relative;
  min-height: 230px;
  padding: 18px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.12
    );
  border-radius: 14px;
  background: #fff;
  transition: 0.3s;
}

.note-card:hover {
  transform: translateY(-4px);
  border-color: #0284C7;
}

.note-card.pinned {
  border-color: #0284C7;
  box-shadow: 0 0 0 1px rgba(2, 132, 199, 0.15);
}

.note-card-top {
  display: flex;
  align-items: center;
  gap: 11px;
}

.note-card-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.3
    );
  border-radius: 11px;
  color: #0284C7;
  background: rgba(
    2,
    132,
    199,
    0.05
  );
}

.note-card-heading {
  min-width: 0;
  flex: 1;
}

.note-card-heading span {
  display: block;
  color: #0284C7;
  font: 8px
    "Courier New",
    monospace;
  letter-spacing: 0.12em;
}

.note-card-heading h4 {
  margin: 5px 0 0;
  overflow: hidden;
  color: #0F172A;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-label {
  color: #0284C7;
  font: 7px
    "Courier New",
    monospace;
}

.note-preview {
  min-height: 68px;
  margin: 18px 0 12px;
  color: #64748B;
  font-size: 11px;
  line-height: 1.7;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.note-tags span,
.note-viewer-tags span {
  padding: 5px 8px;
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.2
    );
  border-radius: 6px;
  background: rgba(
    2,
    132,
    199,
    0.05
  );
  color: #0284C7;
  font: 8px
    "Courier New",
    monospace;
}

.note-card-footer {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid
    rgba(
      15,
      23,
      42,
      0.08
    );
}

.note-card-footer > span {
  color: #64748B;
  font: 7px
    "Courier New",
    monospace;
}

.note-actions {
  display: flex;
  gap: 5px;
}

.note-actions button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.14
    );
  border-radius: 7px;
  background: #fff;
  color: #64748B;
  cursor: pointer;
}

.note-actions button:hover {
  color: #0F172A;
  border-color: #0284C7;
}

.note-actions .note-delete:hover {
  color: #DC2626;
  border-color: rgba(
    220,
    38,
    38,
    0.4
  );
}

/* EMPTY */

.empty-notes {
  grid-column: 1 / -1;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.1
    );
  border-radius: 14px;
  color: #64748B;
  text-align: center;
}

.empty-notes-icon {
  width: 65px;
  height: 65px;
  display: grid;
  place-items: center;
  margin-bottom: 5px;
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.25
    );
  border-radius: 16px;
  color: #0284C7;
}

.empty-notes strong {
  color: #0F172A;
  font-size: 15px;
}

.empty-notes span {
  color: #64748B;
  font-size: 10px;
}

.notes-footer {
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #64748B;
  font: 8px
    "Courier New",
    monospace;
}

/* =====================================================
   NOTE VIEWER
===================================================== */

.note-viewer-overlay {
  z-index: 120;
}

.note-viewer-panel {
  width: min(
    850px,
    92vw
  );
  height: min(
    760px,
    90vh
  );
  min-height: 0;
}

.note-viewer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 25px;
  border-bottom: 1px solid
    rgba(
      15,
      23,
      42,
      0.1
    );
}

.note-viewer-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.5
    );
  border-radius: 16px;
  color: #0284C7;
  background: rgba(
    2,
    132,
    199,
    0.06
  );
}

.note-viewer-header span {
  color: #0284C7;
  font: 8px
    "Courier New",
    monospace;
  letter-spacing: 0.15em;
}

.note-viewer-header h2 {
  margin: 6px 0 0;
  font-size: 28px;
  color: #0F172A;
}

.note-viewer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}

.note-viewer-content {
  flex: 1;
  overflow-y: auto;
  margin-top: 20px;
  padding: 24px;
  border: 1px solid
    rgba(
      15,
      23,
      42,
      0.1
    );
  border-radius: 14px;
  background: #F8FAFC;
  color: #0F172A;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.note-viewer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
  color: #64748B;
  font: 8px
    "Courier New",
    monospace;
}

.note-viewer-footer > div {
  display: flex;
  gap: 8px;
}

.viewer-edit-button,
.viewer-delete-button {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  border-radius: 8px;
  cursor: pointer;
  font: 8px
    "Courier New",
    monospace;
}

.viewer-edit-button {
  border: 1px solid
    rgba(
      2,
      132,
      199,
      0.3
    );
  background: rgba(
    2,
    132,
    199,
    0.06
  );
  color: #0284C7;
}

.viewer-delete-button {
  border: 1px solid
    rgba(
      220,
      38,
      38,
      0.25
    );
  background: rgba(
    220,
    38,
    38,
    0.04
  );
  color: #DC2626;
}
        /* =====================================================
           STUDYBUDDY
        ===================================================== */

        .assistant-message {
          display: flex;
          gap: 16px;
          margin-top: 30px;
          padding: 22px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.08
            );
          border-radius: 15px;
          background: #F8FAFC;
        }

        .assistant-avatar {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
        }

        .assistant-message span {
          color: #0284C7;
          font: 8px
            "Courier New",
            monospace;
        }

        .assistant-message p {
          margin: 8px 0 0;
          color: #64748B;
          font-size: 14px;
          line-height: 1.75;
        }

        .chat-messages {
          max-height: 280px;
          overflow-y: auto;
          margin-top: 20px;
          padding-right: 5px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .chat-message {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.65;
        }

        .ai-message {
          align-self: flex-start;
          max-width: 88%;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.14
            );
          background: rgba(
            2,
            132,
            199,
            0.04
          );
        }

        .user-message {
          align-self: flex-end;
          max-width: 88%;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.14
            );
          background: #0F172A;
        }

        .chat-message-label {
          margin-bottom: 5px;
          color: #0284C7;
          font: 8px
            "Courier New",
            monospace;
        }

        .user-message
          .chat-message-label {
          color: #94A3B8;
        }

        .chat-message-content {
          color: #0F172A;
          white-space: pre-wrap;
        }

        .user-message .chat-message-content {
          color: #fff;
        }

        .typing {
          display: flex;
          gap: 5px;
          padding: 5px 0;
        }

        .typing span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0284C7;
          animation: typing 1.2s
            infinite
            ease-in-out;
        }

        .typing span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 22px 0;
        }

        .suggestions button {
          padding: 11px 14px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.14
            );
          border-radius: 9px;
          background: #fff;
          color: #0F172A;
          font-size: 11px;
          cursor: pointer;
        }

        .chat-input {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .chat-input input {
          flex: 1;
          height: 60px;
          padding: 0 18px;
          outline: none;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 12px;
          background: #fff;
          color: #0F172A;
          font-size: 14px;
        }

        .chat-input button {
          width: 60px;
          height: 60px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 12px;
          background: #0284C7;
          color: white;
          cursor: pointer;
        }

        .chat-input button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .send-loader {
          width: 16px;
          height: 16px;
          border: 2px solid
            rgba(
              255,
              255,
              255,
              0.35
            );
          border-top-color: white;
          border-radius: 50%;
          animation: sendSpin
            0.7s linear
            infinite;
        }

        .ai-note {
          display: block;
          margin-top: 12px;
          color: #94A3B8;
          text-align: center;
          font: 8px
            "Courier New",
            monospace;
        }

        /* =====================================================
           QUIZ SETUP
        ===================================================== */

        .quiz-setup-panel {
          width: min(
            780px,
            92vw
          );
          min-height: 650px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .quiz-setup-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 25px;
          border-bottom: 1px solid
            rgba(
              15,
              23,
              42,
              0.1
            );
        }

        .quiz-setup-content {
          margin-top: 25px;
        }

        .quiz-label {
          margin: 20px 0 9px;
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
        }

        .subject-select-grid {
          display: grid;
          grid-template-columns: repeat(
            3,
            1fr
          );
          gap: 9px;
        }

        .subject-select {
          min-height: 45px;
          padding: 10px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 9px;
          background: #fff;
          color: #64748B;
          cursor: pointer;
        }

        .subject-select.active {
          border-color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
          color: #0284C7;
        }

        .quiz-topic-input {
          width: 100%;
          height: 54px;
          padding: 0 16px;
          outline: none;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 11px;
          background: #fff;
          color: #0F172A;
          font-size: 14px;
        }

        .upload-material-box {
          min-height: 105px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px dashed
            rgba(
              2,
              132,
              199,
              0.3
            );
          border-radius: 13px;
          color: #0284C7;
          cursor: pointer;
          text-align: center;
        }

        .upload-material-box strong {
          color: #0F172A;
          font-size: 13px;
        }

        .upload-material-box span {
          color: #64748B;
          font-size: 10px;
        }

        .remove-material {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          border: 0;
          background: transparent;
          color: #DC2626;
          font: 8px
            "Courier New",
            monospace;
          cursor: pointer;
        }

        .quiz-choice-row {
          display: flex;
          gap: 10px;
        }

        .quiz-choice {
          flex: 1;
          height: 44px;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 9px;
          background: #fff;
          color: #64748B;
          cursor: pointer;
        }

        .quiz-choice.active {
          border-color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
          color: #0284C7;
        }

        .quiz-generate-button {
          width: 100%;
          height: 55px;
          margin-top: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid #0284C7;
          border-radius: 11px;
          background: #0284C7;
          color: white;
          font: 10px
            "Courier New",
            monospace;
          cursor: pointer;
        }

        .quiz-generate-button:disabled {
          opacity: 0.5;
        }

        /* QUIZ */

        .quiz-panel {
          width: min(
            900px,
            92vw
          );
          min-height: 620px;
        }

        .quiz-info {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          color: #64748B;
          font: 8px
            "Courier New",
            monospace;
        }

        .quiz-info span:first-child {
          color: #0284C7;
        }

        .quiz-progress {
          margin-top: 22px;
        }

        .quiz-progress > span {
          display: block;
          color: #64748B;
          font: 9px
            "Courier New",
            monospace;
        }

        .quiz-progress-track {
          width: 100%;
          height: 3px;
          margin-top: 10px;
          overflow: hidden;
          background: rgba(
            15,
            23,
            42,
            0.08
          );
        }

        .quiz-progress-track span {
          display: block;
          height: 100%;
          background: #0284C7;
        }

        .quiz-question {
          margin-top: 35px;
        }

        .quiz-question p {
          margin: 0;
          color: #0F172A;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
        }

        .quiz-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 30px;
        }

        .quiz-option {
          min-height: 70px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          border: 1px solid
            rgba(
              15,
              23,
              42,
              0.16
            );
          border-radius: 13px;
          background: #fff;
          color: #0F172A;
          cursor: pointer;
        }

        .quiz-option.selected {
          border-color: #0284C7;
          background: rgba(
            2,
            132,
            199,
            0.08
          );
          color: #0F172A;
        }

        .option-number {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.25
            );
          border-radius: 9px;
          color: #0284C7;
          font: 11px
            "Courier New",
            monospace;
        }

        .quiz-next-button {
          width: 100%;
          height: 52px;
          margin-top: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid #0284C7;
          border-radius: 11px;
          background: #0284C7;
          color: white;
          font: 10px
            "Courier New",
            monospace;
          cursor: pointer;
        }

        .quiz-next-button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .quiz-result {
          height: 100%;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .quiz-result-icon {
          width: 90px;
          height: 90px;
          display: grid;
          place-items: center;
          margin-bottom: 25px;
          border: 1px solid
            rgba(
              2,
              132,
              199,
              0.4
            );
          border-radius: 50%;
          color: #0284C7;
        }

        .quiz-result h2 {
          margin: 0;
          font-size: 48px;
          color: #0F172A;
        }

        .quiz-result h2 span {
          color: #0284C7;
        }

        .quiz-result-text {
          max-width: 500px;
          margin: 25px 0;
          color: #64748B;
          font-size: 13px;
          line-height: 1.7;
        }

        .quiz-result-actions {
          display: flex;
          gap: 12px;
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes pulse {
          50% {
            opacity: 0.3;
          }
        }

        @keyframes orbFloat {
          50% {
            transform:
              translate(
                -50%,
                calc(
                  -50% - 13px
                )
              );
          }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform:
              translateY(20px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes typing {
          0%,
          60%,
          100% {
            transform: translateY(
              0
            );
            opacity: 0.35;
          }

          30% {
            transform: translateY(
              -4px
            );
            opacity: 1;
          }
        }

        @keyframes sendSpin {
          to {
            transform: rotate(
              360deg
            );
          }
        }

        @keyframes cardOne {
          from {
            opacity: 0;
            transform:
              rotate(-8deg)
              translateX(
                -100px
              );
          }

          to {
            opacity: 1;
            transform: rotate(
              -8deg
            );
          }
        }

        @keyframes cardTwo {
          from {
            opacity: 0;
            transform:
              rotate(8deg)
              translateX(
                100px
              );
          }

          to {
            opacity: 1;
            transform: rotate(
              8deg
            );
          }
        }

        @keyframes cardThree {
          from {
            opacity: 0;
            transform:
              rotate(7deg)
              translateY(
                100px
              );
          }

          to {
            opacity: 1;
            transform: rotate(
              7deg
            );
          }
        }

        @keyframes cardFour {
          from {
            opacity: 0;
            transform:
              rotate(-7deg)
              translateY(
                100px
              );
          }

          to {
            opacity: 1;
            transform: rotate(
              -7deg
            );
          }
        }

        @keyframes floating {
          50% {
            margin-top: -16px;
          }
        }

        @keyframes floatingTwo {
          50% {
            margin-top: 16px;
          }
        }

        @keyframes coreFloat {
          50% {
            transform:
              translate(
                -50%,
                -50%
              )
              translateY(
                -12px
              );
          }
        }

        @keyframes orbitOne {
          to {
            transform:
              translate(
                -50%,
                -50%
              )
              rotate(338deg);
          }
        }

        @keyframes orbitTwo {
          to {
            transform:
              translate(
                -50%,
                -50%
              )
              rotate(408deg);
          }
        }

        @keyframes orbitThree {
          to {
            transform:
              translate(
                -50%,
                -50%
              )
              rotate(295deg);
          }
        }

        @keyframes introFade {
          0%,
          88% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            pointer-events: none;
          }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1050px) {
          .ai-orb-area {
            right: -80px;
            opacity: 0.55;
          }

          .action-grid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .subject-grid {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .plan-form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 760px) {
          .intro-title h1 {
            font-size: 65px;
          }

          .topbar {
            height: 70px;
          }

          .module-name,
          .top-status {
            display: none;
          }

          .hero {
            min-height: 680px;
            padding-top: 100px;
          }

          .hero h1 {
            font-size: 70px;
          }

          .ai-orb-area {
            right: -140px;
            top: 65%;
            opacity: 0.32;
            transform:
              translateY(
                -50%
              )
              scale(0.8);
          }

          .hero-actions {
            flex-direction: column;
            align-items: flex-start;
          }

          .time-plan-strip {
            flex-direction: column;
            align-items: stretch;
            gap: 18px;
          }

          .time-plan-stats {
            width: 100%;
          }

          .time-plan-open {
            width: 100%;
            justify-content: center;
          }

          .stats {
            grid-template-columns: 1fr 1fr;
          }

          .section {
            padding: 80px 20px;
          }

          .action-grid,
          .subject-grid {
            grid-template-columns: 1fr;
          }

          .ai-insight {
            margin: 0 20px 80px;
            padding: 30px;
            flex-direction: column;
            align-items: flex-start;
            gap: 35px;
          }

          .insight-metrics {
            width: 100%;
          }

          .activity-time {
            display: none;
          }

          .subject-select-grid {
            grid-template-columns: 1fr 1fr;
          }

          .quiz-options {
            grid-template-columns: 1fr;
          }

          .plan-summary {
            grid-template-columns: 1fr 1fr;
          }

          .plan-item {
            grid-template-columns:
              62px 20px
              1fr;
          }

          .plan-actions {
            grid-column: 3;
            padding: 0 12px 15px;
          }
          .notes-list {
  grid-template-columns: 1fr;
}

.notes-toolbar {
  flex-direction: column;
}

.notes-toolbar select {
  width: 100%;
}

.notes-input-grid {
  grid-template-columns: 1fr;
}

.notes-summary {
  grid-template-columns: 1fr 1fr;
}

.note-viewer-footer {
  align-items: flex-start;
  flex-direction: column;
}  
        }

        @media (max-width: 480px) {
          .intro-title h1 {
            font-size: 55px;
          }

          .hero {
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero h1 {
            font-size: 58px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .footer {
            flex-direction: column;
            gap: 9px;
          }

          .assistant-overlay {
            padding: 12px;
          }

          .assistant-panel {
            width: 96vw;
            height: 92vh;
            min-height: 0;
            padding: 22px;
            border-radius: 20px;
          }

          .online-label {
            display: none;
          }

          .subject-select-grid {
            grid-template-columns: 1fr;
          }

          .quiz-question p {
            font-size: 19px;
          }

          .quiz-result h2 {
            font-size: 40px;
          }

          .quiz-result-actions {
            flex-direction: column;
            width: 100%;
          }

          .quiz-result-actions button {
            width: 100%;
            justify-content: center;
          }

          .time-plan-stats {
            grid-template-columns: 1fr 1fr;
          }

          .plan-form-grid {
            grid-template-columns: 1fr;
          }

          .plan-item {
            grid-template-columns:
              52px 18px 1fr;
          }

          .plan-details strong {
            font-size: 12px;
          }

          .plan-actions {
            grid-column: 3;
          }
        .notes-summary {
  grid-template-columns: 1fr;
}

.notes-panel {
  padding: 20px;
}

.note-viewer-panel {
  padding: 20px;
}

.note-viewer-header h2 {
  font-size: 21px;
}

.note-viewer-footer > div {
  width: 100%;
}

.viewer-edit-button,
.viewer-delete-button {
  flex: 1;
  justify-content: center;
}    
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );  
}