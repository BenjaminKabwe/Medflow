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
  "/pharmacy": ["admin", "pharmacist", "doctor", "nurse"],
  "/pharmacy/medications(.*)": ["admin", "pharmacist", "doctor"],
  "/pharmacy/inventory(.*)": ["admin", "pharmacist"],
  "/pharmacy/suppliers(.*)": ["admin", "pharmacist"],
  "/pharmacy/purchase-orders(.*)": ["admin", "pharmacist"],
  "/pharmacy/prescriptions(.*)": ["admin", "pharmacist"],
  "/pharmacy/dispensation(.*)": ["admin", "pharmacist", "nurse"],
  "/pharmacy/alerts(.*)": ["admin", "pharmacist"],
  "/lab_technician(.*)": ["admin", "lab_technician"],
  "/lab(.*)": ["admin", "lab_technician"],
  "/record/users": ["admin"],
  "/record/doctors": ["admin"],
  "/record/doctors(.*)": ["admin", "doctor"],
  "/record/staffs": ["admin", "doctor"],
  "/record/patients": ["admin", "doctor", "nurse"],
  "/patient/registrations": ["patient"],
};
