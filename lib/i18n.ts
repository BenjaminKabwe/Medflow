export type Lang = "fr" | "en";

export const translations = {
  fr: {
    /* ── Sidebar navigation ── */
    nav: {
      dashboard:         "Tableau de bord",
      myProfile:         "Mon profil",
      users:             "Utilisateurs",
      doctors:           "Médecins",
      staffs:            "Personnels",
      patients:          "Patients",
      appointments:      "Rendez-vous",
      medicalRecords:    "Dossiers médicaux",
      billing:           "Facturation",
      patientMgmt:       "Gestion patients",
      medications:       "Médicaments",
      records:           "Dossiers",
      prescription:      "Ordonnance",
      myPayments:        "Mes paiements",
      notifications:     "Notifications",
      auditLogs:         "Journaux d'audit",
      settings:          "Paramètres",
      cashierDashboard:  "Caisse",
      cashierSessions:   "Sessions de caisse",
      pharmacy:          "Pharmacie",
      pharmacyCatalog:   "Catalogue",
      pharmacyInventory: "Inventaire",
      pharmacySuppliers: "Fournisseurs",
      pharmacyPurchaseOrders: "Bons de commande",
      pharmacyPrescriptions: "Ordonnances",
      pharmacyDispensation: "Dispensations",
      pharmacyAlerts:    "Alertes stock",
      labQueue:          "File d'attente",
      logout:            "Déconnexion",
    },

    /* ── Sidebar section labels ── */
    sections: {
      principal: "Principal",
      management: "Gestion",
      pharmacy:  "Pharmacie",
      laboratory: "Laboratoire",
      system: "Système",
    },

    /* ── Navbar ── */
    navbar: {
      search:  "Rechercher…",
      lang:    "Langue",
    },

    /* ── Breadcrumb labels ── */
    pages: {
      admin:             "Administration",
      doctor:            "Espace médecin",
      patient:           "Espace patient",
      nurse:             "Espace infirmier",
      record:            "Dossiers",
      patients:          "Patients",
      doctors:           "Médecins",
      staffs:            "Personnels",
      appointments:      "Rendez-vous",
      billing:           "Facturation",
      "medical-records": "Dossiers médicaux",
      users:             "Utilisateurs",
      "system-settings": "Paramètres système",
      "audit-logs":      "Journaux d'audit",
      notifications:     "Notifications",
      self:              "Mon profil",
      registration:      "Inscription",
      cashier:           "Caisse",
      dashboard:         "Tableau de bord",
      "cashier-sessions": "Sessions de caisse",
      pharmacy:          "Pharmacie",
      pharmacist:        "Espace pharmacien",
      medications:       "Médicaments",
      inventory:         "Inventaire",
      suppliers:         "Fournisseurs",
      dispensation:      "Dispensations",
      alerts:            "Alertes",
    },

    /* ── Dashboard stat cards ── */
    stats: {
      patients:          "Patients",
      doctors:           "Médecins",
      appointments:      "Rendez-vous",
      consultation:      "Consultations",
      nurses:            "Infirmières",
      cancelled:         "Annulés",
      pending:           "En attente",
      completed:         "Terminés",
      totalPatients:     "Total patients",
      totalDoctors:      "Total médecins",
      totalAppointments: "Total rendez-vous",
      totalConsult:      "Total consultations",
      totalNurses:       "Total infirmières",
      cancelledAppt:     "Rendez-vous annulés",
      pendingAppt:       "Rendez-vous en attente",
      completedAppt:     "Rendez-vous terminés",
      seeDetails:        "Voir",
    },

    /* ── Available doctors ── */
    doctors: {
      title:       "Médecins disponibles",
      viewAll:     "Voir tout",
      unavailable: "Indisponible aujourd'hui",
      empty:       "Aucun médecin disponible aujourd'hui.",
    },

    /* ── Recent appointments ── */
    recentAppt: {
      title:     "Rendez-vous récents",
      viewAll:   "Voir tout",
      empty:     "Aucun rendez-vous récent.",
      patient:   "Patient",
      date:      "Date",
      time:      "Heure",
      doctor:    "Médecin",
      status:    "Statut",
      actions:   "Actions",
      see:       "Voir",
    },

    /* ── Appointment statuses ── */
    status: {
      PENDING:   "En attente",
      SCHEDULED: "Planifié",
      CANCELLED: "Annulé",
      COMPLETED: "Terminé",
    },

    /* ── Charts ── */
    charts: {
      appointmentsTitle:    "Évolution des rendez-vous",
      appointmentsSubtitle: "Aperçu mensuel",
      summaryTitle:         "Résumé des rendez-vous",
      summarySubtitle:      "Répartition par statut",
      details:              "Détails",
      total:                "Total",
      pending:              "En attente",
      completed:            "Terminés",
      cancelled:            "Annulés",
      appointments:         "Rendez-vous",
      barAppointment:       "Rendez-vous",
      barCompleted:         "Terminés",
    },

    /* ── Landing page ── */
    landing: {
      badge:        "Système de gestion des dossiers patients",
      heroTitle1:   "La santé connectée,",
      heroTitle2:   "réinventée",
      heroDesc:     "MedFlow unifie la gestion des patients, médecins et rendez-vous dans une plateforme intuitive, sécurisée et pensée pour l'excellence médicale.",
      cta1:         "Commencer gratuitement",
      cta2:         "Accéder au tableau de bord",
      viewDashboard: "Voir le tableau de bord",
      newPatient:   "Nouveau patient",
      signIn:       "Se connecter",
      footer:       "Système de gestion électronique des dossiers patients. Tous droits réservés.",
      stats: {
        uptime:     "Disponibilité",
        compliance: "Conformité",
        access:     "Accès sécurisé",
        realtime:   "Mises à jour",
      },
      features: {
        appt:     { title: "Gestion des rendez-vous",    desc: "Planifiez et suivez tous les rendez-vous en temps réel." },
        records:  { title: "Dossiers médicaux",          desc: "Accédez instantanément aux historiques, diagnostics et ordonnances." },
        roles:    { title: "Gestion multi-rôles",        desc: "Admin, médecins, infirmières et patients — chaque rôle a son espace." },
        security: { title: "Sécurité & confidentialité", desc: "Données protégées avec authentification forte et contrôle d'accès." },
      },
    },
  },

  en: {
    /* ── Sidebar navigation ── */
    nav: {
      dashboard:         "Dashboard",
      myProfile:         "My profile",
      users:             "Users",
      doctors:           "Doctors",
      staffs:            "Staff",
      patients:          "Patients",
      appointments:      "Appointments",
      medicalRecords:    "Medical records",
      billing:           "Billing",
      patientMgmt:       "Patient management",
      medications:       "Medications",
      records:           "Records",
      prescription:      "Prescription",
      myPayments:        "My payments",
      notifications:     "Notifications",
      auditLogs:         "Audit logs",
      settings:          "Settings",
      cashierDashboard:  "Cashier",
      cashierSessions:   "Cashier sessions",
      pharmacy:          "Pharmacy",
      pharmacyCatalog:   "Catalog",
      pharmacyInventory: "Inventory",
      pharmacySuppliers: "Suppliers",
      pharmacyPurchaseOrders: "Purchase orders",
      pharmacyPrescriptions: "Prescriptions",
      pharmacyDispensation: "Dispensations",
      pharmacyAlerts:    "Stock alerts",
      labQueue:          "Work queue",
      logout:            "Log out",
    },

    /* ── Sidebar section labels ── */
    sections: {
      principal:  "Main",
      management: "Management",
      pharmacy:   "Pharmacy",
      laboratory: "Laboratory",
      system:     "System",
    },

    /* ── Navbar ── */
    navbar: {
      search: "Search…",
      lang:   "Language",
    },

    /* ── Breadcrumb labels ── */
    pages: {
      admin:             "Administration",
      doctor:            "Doctor space",
      patient:           "Patient space",
      nurse:             "Nurse space",
      record:            "Records",
      patients:          "Patients",
      doctors:           "Doctors",
      staffs:            "Staff",
      appointments:      "Appointments",
      billing:           "Billing",
      "medical-records": "Medical records",
      users:             "Users",
      "system-settings": "System settings",
      "audit-logs":      "Audit logs",
      notifications:     "Notifications",
      self:              "My profile",
      registration:      "Registration",
      cashier:           "Cashier",
      dashboard:         "Dashboard",
      "cashier-sessions": "Cashier sessions",
      pharmacy:          "Pharmacy",
      pharmacist:        "Pharmacist space",
      medications:       "Medications",
      inventory:         "Inventory",
      suppliers:         "Suppliers",
      dispensation:      "Dispensations",
      alerts:            "Alerts",
    },

    /* ── Dashboard stat cards ── */
    stats: {
      patients:          "Patients",
      doctors:           "Doctors",
      appointments:      "Appointments",
      consultation:      "Consultations",
      nurses:            "Nurses",
      cancelled:         "Cancelled",
      pending:           "Pending",
      completed:         "Completed",
      totalPatients:     "Total patients",
      totalDoctors:      "Total doctors",
      totalAppointments: "Total appointments",
      totalConsult:      "Total consultations",
      totalNurses:       "Total nurses",
      cancelledAppt:     "Cancelled appointments",
      pendingAppt:       "Pending appointments",
      completedAppt:     "Completed appointments",
      seeDetails:        "View",
    },

    /* ── Available doctors ── */
    doctors: {
      title:       "Available doctors",
      viewAll:     "View all",
      unavailable: "Unavailable today",
      empty:       "No doctors available today.",
    },

    /* ── Recent appointments ── */
    recentAppt: {
      title:   "Recent appointments",
      viewAll: "View all",
      empty:   "No recent appointments.",
      patient: "Patient",
      date:    "Date",
      time:    "Time",
      doctor:  "Doctor",
      status:  "Status",
      actions: "Actions",
      see:     "View",
    },

    /* ── Appointment statuses ── */
    status: {
      PENDING:   "Pending",
      SCHEDULED: "Scheduled",
      CANCELLED: "Cancelled",
      COMPLETED: "Completed",
    },

    /* ── Charts ── */
    charts: {
      appointmentsTitle:    "Appointment trends",
      appointmentsSubtitle: "Monthly overview",
      summaryTitle:         "Appointment summary",
      summarySubtitle:      "Breakdown by status",
      details:              "Details",
      total:                "Total",
      pending:              "Pending",
      completed:            "Completed",
      cancelled:            "Cancelled",
      appointments:         "Appointments",
      barAppointment:       "Appointments",
      barCompleted:         "Completed",
    },

    /* ── Landing page ── */
    landing: {
      badge:        "Electronic patient record management system",
      heroTitle1:   "Connected healthcare,",
      heroTitle2:   "reimagined",
      heroDesc:     "MedFlow unifies patient, doctor and appointment management in an intuitive, secure platform designed for medical excellence.",
      cta1:         "Get started for free",
      cta2:         "Go to dashboard",
      viewDashboard: "View dashboard",
      newPatient:   "New patient",
      signIn:       "Sign in",
      footer:       "Electronic patient record management system. All rights reserved.",
      stats: {
        uptime:     "Uptime",
        compliance: "Compliance",
        access:     "Secure access",
        realtime:   "Real-time updates",
      },
      features: {
        appt:     { title: "Appointment management",  desc: "Schedule and track all appointments in real time." },
        records:  { title: "Medical records",         desc: "Instantly access histories, diagnoses and prescriptions." },
        roles:    { title: "Multi-role management",   desc: "Admin, doctors, nurses and patients — each role has its own space." },
        security: { title: "Security & privacy",      desc: "Data protected with strong authentication and access control." },
      },
    },
  },
} satisfies Record<Lang, Translations>;

export interface Translations {
  nav: {
    dashboard: string; myProfile: string; users: string; doctors: string;
    staffs: string; patients: string; appointments: string; medicalRecords: string;
    billing: string; patientMgmt: string; medications: string; records: string;
    prescription: string; myPayments: string; notifications: string;
    auditLogs: string; settings: string;
    cashierDashboard: string; cashierSessions: string;
    pharmacy: string; pharmacyCatalog: string; pharmacyInventory: string;
    pharmacySuppliers: string; pharmacyPurchaseOrders: string; pharmacyPrescriptions: string; pharmacyDispensation: string; pharmacyAlerts: string;
    labQueue: string;
    logout: string;
  };
  sections: { principal: string; management: string; pharmacy: string; laboratory: string; system: string };
  navbar: { search: string; lang: string };
  pages: Record<string, string>;
  stats: {
    patients: string; doctors: string; appointments: string; consultation: string;
    nurses: string; cancelled: string; pending: string; completed: string;
    totalPatients: string; totalDoctors: string; totalAppointments: string;
    totalConsult: string; totalNurses: string; cancelledAppt: string;
    pendingAppt: string; completedAppt: string; seeDetails: string;
  };
  doctors: { title: string; viewAll: string; unavailable: string; empty: string };
  recentAppt: {
    title: string; viewAll: string; empty: string; patient: string;
    date: string; time: string; doctor: string; status: string; actions: string; see: string;
  };
  status: { PENDING: string; SCHEDULED: string; CANCELLED: string; COMPLETED: string };
  charts: {
    appointmentsTitle: string; appointmentsSubtitle: string;
    summaryTitle: string; summarySubtitle: string;
    details: string; total: string; pending: string; completed: string;
    cancelled: string; appointments: string; barAppointment: string; barCompleted: string;
  };
  landing: {
    badge: string; heroTitle1: string; heroTitle2: string; heroDesc: string;
    cta1: string; cta2: string; viewDashboard: string; newPatient: string;
    signIn: string; footer: string;
    stats: { uptime: string; compliance: string; access: string; realtime: string };
    features: {
      appt: { title: string; desc: string };
      records: { title: string; desc: string };
      roles: { title: string; desc: string };
      security: { title: string; desc: string };
    };
  };
}
