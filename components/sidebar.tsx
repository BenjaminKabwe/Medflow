import { getRole } from "@/utils/roles";
import { SidebarNav } from "./sidebar-nav";

export const Sidebar = async () => {
  const role = await getRole();
  return <SidebarNav role={role} />;
};
