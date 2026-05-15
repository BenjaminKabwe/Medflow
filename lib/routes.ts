type RouteAccessProps = {
  [key: string]: string[];
};

export const routeAccess: RouteAccessProps = {
  "/admin(.*)": ["admin"],
  "/administration(.*)": ["admin"],
  "/cashier(.*)": ["cashier", "admin"],
  "/patient(.*)": ["patient", "admin", "doctor", "nurse"],
  "/doctor(.*)": ["doctor"],
  "/nurse(.*)": ["nurse", "admin"],
  "/staff(.*)": ["nurse", "lab_technician", "cashier"],
  "/record/users": ["admin"],
  "/record/doctors": ["admin"],
  "/record/doctors(.*)": ["admin", "doctor"],
  "/record/staffs": ["admin", "doctor"],
  "/record/patients": ["admin", "doctor", "nurse"],
  "/patient/registrations": ["patient"],
};
