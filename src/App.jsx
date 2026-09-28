import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { 
  BookOpen, Calendar, LayoutDashboard, Settings as SettingsIcon, 
  CheckCircle2, Clock, CalendarDays, MoreHorizontal, Check,
  ChevronRight, PlayCircle, Plus, Book, FileText, Target,
  Award, Zap, Sun, Moon, Menu, X, Trash2, Edit2, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, deleteDoc, updateDoc
} from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// Follows strictly the mandatory rules for Firebase setup
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'master-study-planner';

// --- SEED DATA ---
const SEED_COURSES = [
  // Semester 1
  { id: 'c-we', semester: 1, name: 'Wind Energy', code: 'WE', credits: 6, color: 'emerald', difficulty: 3, priority: 4, examType: 'written', examDate: '2026-12-15' },
  { id: 'c-ams', semester: 1, name: 'AMS', code: 'AMS', credits: 6, color: 'blue', difficulty: 4, priority: 5, examType: 'written', examDate: '2026-12-18' },
  { id: 'c-vae', semester: 1, name: 'VAE', code: 'VAE', credits: 6, color: 'indigo', difficulty: 3, priority: 3, examType: 'oral', examDate: '2027-01-10' },
  { id: 'c-qc', semester: 1, name: 'Quantum Computing / MCN', code: 'QC/MCN', credits: 6, color: 'violet', difficulty: 5, priority: 5, examType: 'project', examDate: '2027-01-20' },
  { id: 'c-math', semester: 1, name: 'Maths', code: 'MATH', credits: 6, color: 'rose', difficulty: 4, priority: 4, examType: 'written', examDate: '2026-12-10' },
  { id: 'c-cyb', semester: 1, name: 'CyberOps', code: 'CYB', credits: 6, color: 'slate', difficulty: 3, priority: 4, examType: 'assignment', examDate: '2026-12-05' },
  // Semester 2
  { id: 'c-bsn', semester: 2, name: 'BSN', code: 'BSN', credits: 6, color: 'cyan', difficulty: 3, priority: 3, examType: 'written', examDate: '2027-06-15' },
  { id: 'c-pm', semester: 2, name: 'PM', code: 'PM', credits: 6, color: 'amber', difficulty: 2, priority: 2, examType: 'assignment', examDate: '2027-06-20' },
  { id: 'c-job', semester: 2, name: 'JOB', code: 'JOB', credits: 6, color: 'orange', difficulty: 2, priority: 3, examType: 'project', examDate: '2027-06-25' },
  // Semester 3
  { id: 'c-res', semester: 3, name: 'Research Project', code: 'RES', credits: 15, color: 'purple', difficulty: 4, priority: 5, examType: 'project', examDate: '2027-12-15' },
  { id: 'c-thesis', semester: 3, name: 'Master Thesis', code: 'THESIS', credits: 30, color: 'fuchsia', difficulty: 5, priority: 5, examType: 'oral', examDate: '2028-03-01' },
  { id: 'c-wedding', semester: 3, name: 'Wedding (Milestone)', code: 'WEDDING', credits: 0, color: 'pink', difficulty: 1, priority: 1, examType: 'personal', examDate: '2027-09-15', notes: 'Blocks out 2 weeks of study time.' },
];

const SEED_TASKS = [
  { id: 't-1', courseId: 'c-we', title: 'Read Chapter 1', type: 'study', date: new Date().toISOString().split('T')[0], status: 'pending', duration: 120 },
  { id: 't-2', courseId: 'c-ams', title: 'Lecture: Signals', type: 'lecture', date: new Date().toISOString().split('T')[0], status: 'done', duration: 90 },
  { id: 't-3', courseId: 'c-qc', title: 'Assignment 1 Due', type: 'assignment', date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'pending', duration: 0 },
];

const AppContext = createContext();

const COLOR_MAP = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800',
};

const getCourseColor = (colorName) => COLOR_MAP[colorName] || COLOR_MAP['slate'];

const CircularProgress = ({ value, max = 100, size = 120, strokeWidth = 10, color = 'text-blue-500' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = isNaN(value) || !value ? 0 : value;
  const offset = circumference - (safeValue / max) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx={size/2} cy={size/2} r={radius} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx={size/2} cy={size/2} r={radius} className={`stroke-current ${color} transition-all duration-1000 ease-in-out`} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{Math.round((safeValue/max)*100)}%</span>
      </div>
    </div>
  );
};

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userPath = `artifacts/${appId}/users/${user.uid}`;
    let isSubscribed = true;

    // Fetch Courses
    const unsubCourses = onSnapshot(
      collection(db, `${userPath}/courses`),
      (snapshot) => {
        if (!isSubscribed) return;
        const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Seed data if empty
        if (fetchedCourses.length === 0) {
          SEED_COURSES.forEach(course => {
            setDoc(doc(db, `${userPath}/courses`, course.id), course);
          });
        } else {
          setCourses(fetchedCourses);
        }
      },
      (err) => console.error("Error fetching courses:", err)
    );

    // Fetch Tasks
    const unsubTasks = onSnapshot(
      collection(db, `${userPath}/tasks`),
      (snapshot) => {
        if (!isSubscribed) return;
        const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (fetchedTasks.length === 0) {
           SEED_TASKS.forEach(task => {
            setDoc(doc(db, `${userPath}/tasks`, task.id), task);
          });
        } else {
          setTasks(fetchedTasks);
          setLoading(false);
        }
      },
      (err) => console.error("Error fetching tasks:", err)
    );

    return () => {
      isSubscribed = false;
      unsubCourses();
      unsubTasks();
    };
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const addOrUpdateTask = async (taskData) => {
    if (!user) return;
    const taskId = taskData.id || `t-${Date.now()}`;
    await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/tasks`, taskId), { ...taskData, id: taskId });
  };

  const updateCourse = async (courseData) => {
    if (!user) return;
    await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/courses`, courseData.id), courseData);
  };

  return (
    <AppContext.Provider value={{ user, courses, tasks, loading, theme, toggleTheme, addOrUpdateTask, updateCourse }}>
      {children}
    </AppContext.Provider>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, colorClass = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300", className="" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
    {children}
  </span>
);

const Dashboard = () => {
  const { courses, tasks, addOrUpdateTask } = useContext(AppContext);
  const today = new Date().toISOString().split('T')[0];
  
  const todayTasks = tasks.filter(t => t.date === today);
  const upcomingDeadlines = tasks
    .filter(t => t.type === 'assignment' && t.date >= today && t.status !== 'done')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const totalToday = todayTasks.length;
  const progressPercent = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    addOrUpdateTask({ ...task, status: newStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back. Here's your study overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <Card className="flex flex-col items-center justify-center col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 self-start">Today's Progress</h3>
          <CircularProgress value={completedToday} max={totalToday || 1} color="text-indigo-500" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {completedToday} of {totalToday} tasks completed
          </p>
          <div className="mt-4 w-full flex items-center justify-between text-sm bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
            <span className="flex items-center text-indigo-700 dark:text-indigo-300">
              <Zap className="w-4 h-4 mr-2" /> Current Streak
            </span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300">12 Days</span>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card className="col-span-1 md:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Today's Schedule</h3>
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric'})}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No tasks scheduled for today. Take a break!</div>
            ) : (
              todayTasks.map(task => {
                const course = courses.find(c => c.id === task.courseId);
                return (
                  <div key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      task.status === 'done' 
                        ? 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 opacity-60' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.status === 'done' ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                        }`}
                      >
                        {task.status === 'done' && <Check className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {course && (
                            <Badge colorClass={getCourseColor(course.color)} className="text-[10px] px-1.5 py-0">
                              {course.code}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {task.duration} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Upcoming Deadlines & Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-rose-500" /> Upcoming Deadlines
          </h3>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
               <div className="text-center py-6 text-slate-400 text-sm">No upcoming deadlines.</div>
            ) : upcomingDeadlines.map(task => {
               const course = courses.find(c => c.id === task.courseId);
               const daysLeft = Math.ceil((new Date(task.date) - new Date()) / (1000 * 60 * 60 * 24));
               const urgencyColor = daysLeft <= 3 ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' : 
                                    daysLeft <= 7 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' : 
                                    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30';
               return (
                <div key={task.id} className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{course?.name}</p>
                  </div>
                  <Badge className={urgencyColor}>
                    {daysLeft === 0 ? 'Today' : `In ${daysLeft} days`}
                  </Badge>
                </div>
               );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-indigo-500" /> Degree Progress
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">Total Credits (ECTS)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">24 / 90</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '26%' }}></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Milestone Tracker</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                  <span className="text-slate-600 dark:text-slate-300">Semester 1 Registration</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-300 mr-2"></div>
                  <span className="text-slate-600 dark:text-slate-300">Thesis Topic Selection</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SemesterView = ({ onNavigateToCourse }) => {
  const { courses } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(1);

  const semesters = [1, 2, 3];
  const activeCourses = courses.filter(c => c.semester === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Semesters</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your course progression.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {semesters.map(sem => (
          <button
            key={sem}
            onClick={() => setActiveTab(sem)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === sem 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Semester {sem}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCourses.map(course => (
          <div 
            key={course.id}
            onClick={() => onNavigateToCourse(course)}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all p-5 flex flex-col h-full relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${COLOR_MAP[course.color]?.split(' ')[0] || 'bg-slate-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge colorClass={getCourseColor(course.color)} className="mb-2">
                  {course.code}
                </Badge>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {course.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-700">{course.credits}</span>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">ECTS</span>
              </div>
            </div>

            <div className="mt-auto space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center"><CalendarDays className="w-4 h-4 mr-1"/> Exam Date</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{course.examDate}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center"><Target className="w-4 h-4 mr-1"/> Priority</span>
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map(p => (
                      <div key={p} className={`w-2 h-2 rounded-full ${p <= course.priority ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
                <div className={`h-1.5 rounded-full ${COLOR_MAP[course.color]?.split(' ')[0].replace('bg-','bg-').replace('-100','-500') || 'bg-indigo-500'}`} style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CoursePage = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState('syllabus');

  if (!course) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center">
        <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Semesters
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Badge colorClass={getCourseColor(course.color)} className="mb-3 px-3 py-1 text-sm">
            {course.code} • Semester {course.semester}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{course.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-4 text-sm">
            <span>{course.credits} ECTS</span>
            <span>Exam: {course.examType} ({course.examDate})</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center">
            <PlayCircle className="w-4 h-4 mr-2" /> Start Focus Timer
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        {['syllabus', 'lectures', 'assignments', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'syllabus' && (
          <Card className="min-h-[300px]">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Course Syllabus</h3>
               <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center">
                 <Plus className="w-4 h-4 mr-1" /> Add Topic
               </button>
             </div>
             
             {/* Mocked Syllabus Items */}
             <div className="space-y-4">
               {[
                 { title: 'Introduction & Foundations', status: 'Mastered' },
                 { title: 'Advanced Concepts', status: 'Reviewing' },
                 { title: 'Practical Applications', status: 'Learning' },
                 { title: 'Final Project Prep', status: 'Not started' }
               ].map((topic, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-500 font-medium text-sm shadow-sm border border-slate-200 dark:border-slate-600">
                        {i+1}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{topic.title}</span>
                    </div>
                    <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-md px-2 py-1 text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500">
                      <option>{topic.status}</option>
                      <option>Not started</option>
                      <option>Learning</option>
                      <option>Reviewing</option>
                      <option>Mastered</option>
                    </select>
                 </div>
               ))}
             </div>
          </Card>
        )}

        {activeTab === 'lectures' && (
          <Card className="min-h-[300px] flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Lecture tracking module coming soon.</p>
            </div>
          </Card>
        )}

        {activeTab === 'notes' && (
          <Card className="min-h-[300px]">
            <textarea 
              className="w-full h-64 bg-transparent resize-none outline-none text-slate-700 dark:text-slate-300 placeholder-slate-400"
              placeholder="Type your personal notes here... (Rich text editor would replace this in full version)"
              defaultValue={course.notes || ""}
            />
          </Card>
        )}

        {activeTab === 'assignments' && (
           <Card className="min-h-[300px] flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Assignments and Grade Tracker module coming soon.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const WeeklyPlanner = () => {
  const { tasks, courses } = useContext(AppContext);
  
  // Generating current week days (Mon-Sun)
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1;
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(curr.setDate(first + i));
    return d.toISOString().split('T')[0];
  });

  const hours = Array.from({length: 15}).map((_, i) => i + 8); // 8 AM to 10 PM

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Weekly Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize your study blocks.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm border border-indigo-200 dark:border-indigo-800">
          <Zap className="w-4 h-4 mr-2" /> Auto-plan my week
        </button>
      </header>

      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="p-3 text-center text-xs font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">Time</div>
          {weekDays.map(dateStr => {
            const date = new Date(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            return (
              <div key={dateStr} className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                <div className={`text-xs font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg mt-1 font-medium ${isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Grid Body */}
        <div className="flex-1 overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800 last:border-b-0 group">
              <div className="p-2 text-right text-xs text-slate-400 border-r border-slate-200 dark:border-slate-800 relative">
                <span className="absolute top-[-8px] right-2 bg-white dark:bg-slate-900 px-1">{hour}:00</span>
              </div>
              {weekDays.map(dateStr => {
                // Find task starting at this hour (mocked logic for visual)
                const hourTask = tasks.find(t => t.date === dateStr && parseInt(t.id.slice(-1)) === hour % 3); // Fake placement
                
                return (
                  <div key={`${dateStr}-${hour}`} className="p-1 border-r border-slate-100 dark:border-slate-800 last:border-r-0 min-h-[60px] relative hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-crosshair transition-colors">
                    {/* Render a block if exists (mocking visual placement) */}
                    {hourTask && hour === 10 && (
                       <div className="absolute top-1 left-1 right-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] p-1.5 rounded shadow-sm overflow-hidden dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-200 z-10 h-[52px]">
                         <span className="font-semibold block truncate">Wind Energy</span>
                         Lecture
                       </div>
                    )}
                    {dateStr === new Date().toISOString().split('T')[0] && hour === 14 && (
                       <div className="absolute top-1 left-1 right-1 bg-blue-100 border border-blue-300 text-blue-800 text-[10px] p-1.5 rounded shadow-sm overflow-hidden dark:bg-blue-900/60 dark:border-blue-700 dark:text-blue-200 z-10 h-[110px]">
                         <span className="font-semibold block truncate">Study: AMS</span>
                         Signals Review
                       </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const { user, loading, theme, toggleTheme } = useContext(AppContext);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const navigateTo = (view) => {
    setCurrentView(view);
    setSelectedCourse(null);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'weekly', label: 'Weekly Planner', icon: Calendar },
    { id: 'semesters', label: 'Semesters', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 transition-colors font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center font-bold text-lg">
           <BookOpen className="w-5 h-5 text-indigo-600 mr-2" /> MS Planner
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
      `}>
        <div className="p-6 hidden md:flex items-center font-bold text-xl text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-md">
             <BookOpen className="w-5 h-5 text-white" />
           </div>
           CommSys Planner
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3 mt-4 md:mt-0">Menu</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id && !selectedCourse;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <div className="flex items-center px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              MS
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Student Profile</p>
              <p className="text-xs text-slate-500 truncate" title={user?.uid}>{user?.uid?.substring(0,8)}...</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-6xl h-full">
          {selectedCourse ? (
            <CoursePage course={selectedCourse} onBack={() => setSelectedCourse(null)} />
          ) : currentView === 'dashboard' ? (
            <Dashboard />
          ) : currentView === 'semesters' ? (
            <SemesterView onNavigateToCourse={(c) => setSelectedCourse(c)} />
          ) : currentView === 'weekly' ? (
            <WeeklyPlanner />
          ) : (
             <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
               <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
               <h2 className="text-xl font-semibold">Module Coming Soon</h2>
               <p className="text-sm mt-2 max-w-md text-center">Settings, advanced thesis tracking, and focus timers are being built for the next iteration.</p>
             </div>
          )}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}