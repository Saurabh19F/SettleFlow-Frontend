import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen overflow-hidden p-3 md:p-5">
      <div className="mx-auto flex h-full max-w-[1600px] gap-3 md:gap-5">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-24 pr-1 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
