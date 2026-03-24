"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Task, updateTaskStatus, deleteTask } from "@/lib/firebase/tasks";
import { useAuth } from "@/components/providers/AuthProvider";
import { Clock, CheckCircle2, Circle, MoreVertical, Trash2 } from "lucide-react";

export default function TaskBoard({ roomId, role }: { roomId: string, role: "Leader" | "Member" }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "tasks"),
      where("roomId", "==", roomId),
      // orderBy("createdAt", "desc") // Requires compound index, omitting for ease of local testing
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      // Sort in memory to avoid index requirements
      tasksData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleStatusChange = async (taskId: string, currentStatus: Task["status"]) => {
    const nextStatus = currentStatus === "todo" ? "in-progress" : currentStatus === "in-progress" ? "done" : "todo";
    await updateTaskStatus(taskId, nextStatus);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 animate-pulse">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Upload an assignment document in the Documents tab and let AI generate tasks automatically.
        </p>
      </div>
    );
  }

  // Group tasks
  const todo = tasks.filter(t => t.status === "todo");
  const inProgress = tasks.filter(t => t.status === "in-progress");
  const done = tasks.filter(t => t.status === "done");
  const pendingTasks = tasks.filter(t => t.status !== "done");

  const sendReminders = async () => {
    if (!confirm("Send AI-generated reminder emails to all members with pending tasks?")) return;
    setSendingReminders(true);
    try {
      const memberIds = Array.from(new Set(pendingTasks.map(t => t.assigneeId)));
      const res = await fetch("/api/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberIds, 
          roomName: "Team Project", 
          tasks: pendingTasks.map(t => ({ title: t.title, assigneeId: t.assigneeId, deadline: t.deadline }))
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      alert("Reminders generated and sent successfully!");
    } catch (err) {
      alert("Error sending reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  return (
    <div className="space-y-4">
      {role === "Leader" && pendingTasks.length > 0 && (
        <div className="flex justify-between items-center bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div>
            <h4 className="font-semibold text-amber-900">Task Reminders</h4>
            <p className="text-sm text-amber-700">There are {pendingTasks.length} pending tasks. Send a professional AI-generated email reminder.</p>
          </div>
          <button 
            onClick={sendReminders}
            disabled={sendingReminders}
            className="flex items-center px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {sendingReminders ? "Generating & Sending..." : "Send AI Reminders"}
          </button>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        <TaskColumn title="To Do" tasks={todo} icon={<Circle className="w-5 h-5 text-slate-400" />} onStatusChange={handleStatusChange} onDelete={handleDelete} role={role} currentUser={user?.uid || ""} />
        <TaskColumn title="In Progress" tasks={inProgress} icon={<Clock className="w-5 h-5 text-blue-500" />} onStatusChange={handleStatusChange} onDelete={handleDelete} role={role} currentUser={user?.uid || ""} />
        <TaskColumn title="Done" tasks={done} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} onStatusChange={handleStatusChange} onDelete={handleDelete} role={role} currentUser={user?.uid || ""} />
      </div>
    </div>
  );
}

function TaskColumn({ 
  title, 
  tasks, 
  icon, 
  onStatusChange, 
  onDelete, 
  role, 
  currentUser 
}: { 
  title: string, 
  tasks: Task[], 
  icon: React.ReactNode, 
  onStatusChange: (id: string, s: Task["status"]) => void,
  onDelete: (id: string) => void,
  role: "Leader" | "Member",
  currentUser: string
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-slate-800 flex items-center">
          {icon} <span className="ml-2">{title}</span>
        </h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="flex-1 space-y-3">
        {tasks.map(task => {
          const isAssignee = task.assigneeId === currentUser;
          const canEdit = role === "Leader" || isAssignee;

          return (
            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900 leading-tight">{task.title}</h4>
                {role === "Leader" && (
                  <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm mr-2 ${isAssignee ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    {task.assigneeName?.charAt(0) || "?"}
                  </div>
                  <span className="text-xs text-slate-600 truncate max-w-[80px]">
                    {task.assigneeName || "Unassigned"}
                  </span>
                </div>
                
                {canEdit ? (
                  <button 
                    onClick={() => onStatusChange(task.id, task.status)}
                    className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    Move
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">View Only</span>
                )}
              </div>
              {task.deadline && (
                <div className="mt-3 pt-3 border-t border-slate-50 text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                  <span>Deadline:</span>
                  <span className={new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-slate-500'}>
                    {task.deadline}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
