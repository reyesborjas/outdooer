// src/i18n/translations.js

const translations = {
    en: {
      teamManagement: {
        // General
        pageTitle: "Team Management",
        loading: "Loading team data...",
        noTeam: "No team found. Please create a team or join one first.",
        returnToDashboard: "Return to Dashboard",
        
        // Team Creation
        createTeamTitle: "Create Your Guide Team",
        createTeamDescription: "You don't have a team yet. As a guide, you can create your own team to manage activities and expeditions.",
        teamNameLabel: "Team Name",
        teamNamePlaceholder: "Enter team name",
        createTeamButton: "Create Team",
        creating: "Creating...",
        
        // Team Header
        editButton: "Edit",
        yourRole: "Your role:",
        newActivity: "New Activity",
        newExpedition: "New Expedition",
        
        // Tabs
        overview: "Overview",
        members: "Members",
        invitations: "Invitations",
        activities: "Activities",
        expeditions: "Expeditions",
        settings: "Team Settings",
        
        // Team Stats
        teamStats: "Team Stats",
        membersCount: "Members",
        masterGuide: "Master Guide",
        createdOn: "Created On",
        
        // Role Names
        roleNames: "Role Names",
        roleNamesDescription: "Customize the names of guide roles for your team. These names will be displayed throughout the platform.",
        viewHistory: "View History",
        hideHistory: "Hide History",
        changeHistory: "Change History",
        changedBy: "Changed By",
        date: "Date",
        setting: "Setting",
        oldValue: "Old Value",
        newValue: "New Value",
        noHistoryAvailable: "No change history available",
        saveRoleNames: "Save Role Names",
        saving: "Saving...",
        warningTitle: "Warning",
        roleNameEmptyError: "Role name cannot be empty",
        roleNameMinLengthError: (min) => `Role name must be at least ${min} characters`,
        roleNameMaxLengthError: (max) => `Role name cannot exceed ${max} characters`,
        
        // Role Levels
        level1Description: "The team owner and highest authority level.",
        level2Description: "Can help manage the team and create activities/expeditions.",
        level3Description: "Can create and lead activities.",
        level4Description: "Basic guide with limited permissions.",
        
        // Role Names Warning Messages
        rolesIdenticalWarning: (level1, level2) => `Role names for Level ${level1} and Level ${level2} are identical.`,
        rolesSimilarWarning: (level1, level2) => `Role names for Level ${level1} and Level ${level2} are very similar.`,
        
        // Team Status
        teamStatus: "Team Status",
        currentStatus: "Current Status:",
        active: "Active",
        inactive: "Inactive",
        activeDescription: "Your team is currently active. Team members can view and join activities and expeditions.",
        inactiveDescription: "Your team is currently inactive. Activities and expeditions will not be visible to explorers.",
        deactivateTeam: "Deactivate Team",
        activateTeam: "Activate Team",
        activating: "Activating...",
        
        // Danger Zone
        dangerZone: "Danger Zone",
        dangerWarning: "Warning: These actions cannot be undone!",
        deleteTeam: "Delete Team",
        deleteTeamDescription: "Permanently delete this team and all associated data. All activities and expeditions will be removed.",
        
        // Deactivate Modal
        deactivateTeamTitle: "Deactivate Team",
        deactivateConfirmation: "Are you sure you want to deactivate your team?",
        deactivateWhileInactive: "While deactivated:",
        deactivateEffect1: "Your team's activities and expeditions will be hidden from explorers",
        deactivateEffect2: "Team members will still have access to the team dashboard",
        deactivateEffect3: "You can reactivate the team at any time",
        cancel: "Cancel",
        
        // Delete Modal
        deleteTeamTitle: "Delete Team",
        deleteWarning: "Warning: This action cannot be undone!",
        deleteEffect: "Deleting your team will permanently remove all associated data, including:",
        deleteEffect1: "All team activities and expeditions",
        deleteEffect2: "All member associations",
        deleteEffect3: "All reservations and bookings",
        confirmDeleteLabel: "To confirm, please type",
        confirmDeletePlaceholder: (name) => `Type "${name}" to confirm`,
        textDoesNotMatch: "Text does not match team name exactly.",
        deleteTeamButton: "Delete Team Permanently",
        deleting: "Deleting...",
        
        // Team Members Tab
        membersTitle: "Team Members",
        searchMembers: "Search members...",
        memberColumn: "Member",
        roleColumn: "Role",
        emailColumn: "Email",
        joinedColumn: "Joined",
        actionsColumn: "Actions",
        noMembersFound: "No members found",
        changeRole: "Change Role",
        removeMember: "Remove",
        
        // Change Role Modal
        changeRoleTitle: "Change Member Role",
        changeRoleFor: "Change role for",
        roleLabel: "Role",
        updateRole: "Update Role",
        updating: "Updating...",
        
        // Remove Member Modal
        removeMemberTitle: "Remove Team Member",
        removeConfirmation: "Are you sure you want to remove",
        fromTeam: "from the team?",
        removeWarning: "This action cannot be undone.",
        removingMember: "Removing...",
        
        // Team Invitations Tab
        invitationsTitle: "Team Invitations",
        generateInvitation: "Generate Invitation",
        invitationDescription: "Invite new guides to join your team by generating invitation codes. Share these codes with potential team members so they can register as guides and join your team.",
        activeInvitations: "Active Invitations",
        invitationCodeColumn: "Invitation Code",
        usageColumn: "Usage",
        expiresColumn: "Expires",
        createdByColumn: "Created By",
        noActiveInvitations: "No active invitations",
        generateAnInvitation: "Generate an invitation",
        copyLink: "Copy Link",
        
        // Generate Invitation Modal
        generateInvitationTitle: "Generate Team Invitation",
        invitationCodeGenerated: "Invitation Code Generated",
        yourInvitationCode: "Your invitation code has been generated:",
        shareLink: "Share this link with your invite:",
        invitationDetails: "Invitation Details:",
        roleLevel: "Guide Role",
        selectRoleLevel: "Select the role level for the invited guide.",
        maxUses: "Maximum Uses",
        maxUsesDescription: "How many guides can use this invitation code.",
        expiresIn: "Expires In (Days)",
        expiresInDescription: "Number of days before this invitation expires.",
        doneButton: "Done",
        
        // Team Activities Tab
        activitiesTitle: "Team Activities",
        searchActivities: "Search activities...",
        allStatuses: "All Statuses",
        noActivitiesFound: "No activities found",
        createFirstActivity: "Create your first activity",
        activityColumn: "Activity",
        typeColumn: "Type",
        priceColumn: "Price",
        statusColumn: "Status",
        leaderColumn: "Leader",
        createdColumn: "Created",
        notAssigned: "Not assigned",
        view: "View",
        edit: "Edit",
        dates: "Dates",
        
        // Team Expeditions Tab
        expeditionsTitle: "Team Expeditions",
        searchExpeditions: "Search expeditions...",
        noExpeditionsFound: "No expeditions found",
        createFirstExpedition: "Create your first expedition",
        expeditionColumn: "Expedition",
        datesColumn: "Dates",
        capacityColumn: "Capacity",
        to: "to",
        participants: "participants",
        
        // Team Overview Tab
        overviewTitle: "Team Overview",
        totalActivities: "Total Activities",
        totalExpeditions: "Total Expeditions",
        recentActivities: "Recent Activities",
        upcomingExpeditions: "Upcoming Expeditions",
        viewAll: "View All",
        noActivitiesYet: "No activities yet",
        createAnActivity: "Create an activity",
        noUpcomingExpeditions: "No upcoming expeditions",
        createAnExpedition: "Create an expedition",
        
        // Access Restrictions
        accessRestricted: "Access Restricted",
        onlyMasterGuideAccess: "Only the Master Guide can access team settings.",
        viewOnlyMode: "View Only Mode",
        
        // Success/Error Messages
        teamCreatedSuccess: "Team created successfully!",
        teamNameUpdatedSuccess: "Team name updated successfully!",
        roleConfigUpdatedSuccess: "Team role configuration updated successfully!",
        teamActivatedSuccess: "Team activated successfully!",
        teamDeactivatedSuccess: "Team deactivated successfully!",
        teamDeletedSuccess: "Team deleted successfully!",
        memberRoleUpdatedSuccess: "Member role updated successfully!",
        memberRemovedSuccess: "Team member removed successfully!",
        invitationGeneratedSuccess: "Invitation code generated successfully!",
        linkCopiedSuccess: "Invitation link copied to clipboard!",
        
        fixValidationErrors: "Please fix the validation errors before saving."
      }
    },
    
    es: {
      teamManagement: {
        // General
        pageTitle: "Gestión de Equipo",
        loading: "Cargando datos del equipo...",
        noTeam: "No se encontró ningún equipo. Por favor, crea un equipo o únete a uno primero.",
        returnToDashboard: "Volver al Dashboard",
        
        // Team Creation
        createTeamTitle: "Crea Tu Equipo de Guías",
        createTeamDescription: "Aún no tienes un equipo. Como guía, puedes crear tu propio equipo para gestionar actividades y expediciones.",
        teamNameLabel: "Nombre del Equipo",
        teamNamePlaceholder: "Introduce el nombre del equipo",
        createTeamButton: "Crear Equipo",
        creating: "Creando...",
        
        // Team Header
        editButton: "Editar",
        yourRole: "Tu rol:",
        newActivity: "Nueva Actividad",
        newExpedition: "Nueva Expedición",
        
        // Tabs
        overview: "Resumen",
        members: "Miembros",
        invitations: "Invitaciones",
        activities: "Actividades",
        expeditions: "Expediciones",
        settings: "Configuración del Equipo",
        
        // Team Stats
        teamStats: "Estadísticas del Equipo",
        membersCount: "Miembros",
        masterGuide: "Guía Maestro",
        createdOn: "Creado el",
        
        // Role Names
        roleNames: "Nombres de Roles",
        roleNamesDescription: "Personaliza los nombres de los roles de guía para tu equipo. Estos nombres se mostrarán en toda la plataforma.",
        viewHistory: "Ver Historial",
        hideHistory: "Ocultar Historial",
        changeHistory: "Historial de Cambios",
        changedBy: "Cambiado por",
        date: "Fecha",
        setting: "Configuración",
        oldValue: "Valor Anterior",
        newValue: "Valor Nuevo",
        noHistoryAvailable: "No hay historial de cambios disponible",
        saveRoleNames: "Guardar Nombres de Roles",
        saving: "Guardando...",
        warningTitle: "Advertencia",
        roleNameEmptyError: "El nombre del rol no puede estar vacío",
        roleNameMinLengthError: (min) => `El nombre del rol debe tener al menos ${min} caracteres`,
        roleNameMaxLengthError: (max) => `El nombre del rol no puede exceder los ${max} caracteres`,
        
        // Role Levels
        level1Description: "El propietario del equipo y el nivel de autoridad más alto.",
        level2Description: "Puede ayudar a gestionar el equipo y crear actividades/expediciones.",
        level3Description: "Puede crear y liderar actividades.",
        level4Description: "Guía básico con permisos limitados.",
        
        // Role Names Warning Messages
        rolesIdenticalWarning: (level1, level2) => `Los nombres de rol para el Nivel ${level1} y el Nivel ${level2} son idénticos.`,
        rolesSimilarWarning: (level1, level2) => `Los nombres de rol para el Nivel ${level1} y el Nivel ${level2} son muy similares.`,
        
        // Team Status
        teamStatus: "Estado del Equipo",
        currentStatus: "Estado actual:",
        active: "Activo",
        inactive: "Inactivo",
        activeDescription: "Tu equipo está actualmente activo. Los miembros del equipo pueden ver y unirse a actividades y expediciones.",
        inactiveDescription: "Tu equipo está actualmente inactivo. Las actividades y expediciones no serán visibles para los exploradores.",
        deactivateTeam: "Desactivar Equipo",
        activateTeam: "Activar Equipo",
        activating: "Activando...",
        
        // Danger Zone
        dangerZone: "Zona de Peligro",
        dangerWarning: "Advertencia: ¡Estas acciones no se pueden deshacer!",
        deleteTeam: "Eliminar Equipo",
        deleteTeamDescription: "Eliminar permanentemente este equipo y todos los datos asociados. Se eliminarán todas las actividades y expediciones.",
        
        // Deactivate Modal
        deactivateTeamTitle: "Desactivar Equipo",
        deactivateConfirmation: "¿Estás seguro de que deseas desactivar tu equipo?",
        deactivateWhileInactive: "Mientras esté desactivado:",
        deactivateEffect1: "Las actividades y expediciones de tu equipo estarán ocultas para los exploradores",
        deactivateEffect2: "Los miembros del equipo seguirán teniendo acceso al panel del equipo",
        deactivateEffect3: "Puedes reactivar el equipo en cualquier momento",
        cancel: "Cancelar",
        
        // Delete Modal
        deleteTeamTitle: "Eliminar Equipo",
        deleteWarning: "Advertencia: ¡Esta acción no se puede deshacer!",
        deleteEffect: "Eliminar tu equipo eliminará permanentemente todos los datos asociados, incluyendo:",
        deleteEffect1: "Todas las actividades y expediciones del equipo",
        deleteEffect2: "Todas las asociaciones de miembros",
        deleteEffect3: "Todas las reservas y bookings",
        confirmDeleteLabel: "Para confirmar, por favor escribe",
        confirmDeletePlaceholder: (name) => `Escribe "${name}" para confirmar`,
        textDoesNotMatch: "El texto no coincide exactamente con el nombre del equipo.",
        deleteTeamButton: "Eliminar Equipo Permanentemente",
        deleting: "Eliminando...",
        
        // Team Members Tab
        membersTitle: "Miembros del Equipo",
        searchMembers: "Buscar miembros...",
        memberColumn: "Miembro",
        roleColumn: "Rol",
        emailColumn: "Email",
        joinedColumn: "Se unió",
        actionsColumn: "Acciones",
        noMembersFound: "No se encontraron miembros",
        changeRole: "Cambiar Rol",
        removeMember: "Eliminar",
        
        // Change Role Modal
        changeRoleTitle: "Cambiar Rol del Miembro",
        changeRoleFor: "Cambiar rol para",
        roleLabel: "Rol",
        updateRole: "Actualizar Rol",
        updating: "Actualizando...",
        
        // Remove Member Modal
        removeMemberTitle: "Eliminar Miembro del Equipo",
        removeConfirmation: "¿Estás seguro de que deseas eliminar a",
        fromTeam: "del equipo?",
        removeWarning: "Esta acción no se puede deshacer.",
        removingMember: "Eliminando...",
        
        // Team Invitations Tab
        invitationsTitle: "Invitaciones del Equipo",
        generateInvitation: "Generar Invitación",
        invitationDescription: "Invita a nuevos guías a unirse a tu equipo generando códigos de invitación. Comparte estos códigos con posibles miembros del equipo para que puedan registrarse como guías y unirse a tu equipo.",
        activeInvitations: "Invitaciones Activas",
        invitationCodeColumn: "Código de Invitación",
        usageColumn: "Uso",
        expiresColumn: "Expira",
        createdByColumn: "Creado por",
        noActiveInvitations: "No hay invitaciones activas",
        generateAnInvitation: "Generar una invitación",
        copyLink: "Copiar Enlace",
        
        // Generate Invitation Modal
        generateInvitationTitle: "Generar Invitación de Equipo",
        invitationCodeGenerated: "Código de Invitación Generado",
        yourInvitationCode: "Tu código de invitación ha sido generado:",
        shareLink: "Comparte este enlace con tu invitación:",
        invitationDetails: "Detalles de la Invitación:",
        roleLevel: "Rol de Guía",
        selectRoleLevel: "Selecciona el nivel de rol para el guía invitado.",
        maxUses: "Usos Máximos",
        maxUsesDescription: "Cuántos guías pueden usar este código de invitación.",
        expiresIn: "Expira En (Días)",
        expiresInDescription: "Número de días antes de que expire esta invitación.",
        doneButton: "Hecho",
        
        // Team Activities Tab
        activitiesTitle: "Actividades del Equipo",
        searchActivities: "Buscar actividades...",
        allStatuses: "Todos los Estados",
        noActivitiesFound: "No se encontraron actividades",
        createFirstActivity: "Crea tu primera actividad",
        activityColumn: "Actividad",
        typeColumn: "Tipo",
        priceColumn: "Precio",
        statusColumn: "Estado",
        leaderColumn: "Líder",
        createdColumn: "Creado",
        notAssigned: "No asignado",
        view: "Ver",
        edit: "Editar",
        dates: "Fechas",
        
        // Team Expeditions Tab
        expeditionsTitle: "Expediciones del Equipo",
        searchExpeditions: "Buscar expediciones...",
        noExpeditionsFound: "No se encontraron expediciones",
        createFirstExpedition: "Crea tu primera expedición",
        expeditionColumn: "Expedición",
        datesColumn: "Fechas",
        capacityColumn: "Capacidad",
        to: "hasta",
        participants: "participantes",
        
        // Team Overview Tab
        overviewTitle: "Resumen del Equipo",
        totalActivities: "Total de Actividades",
        totalExpeditions: "Total de Expediciones",
        recentActivities: "Actividades Recientes",
        upcomingExpeditions: "Próximas Expediciones",
        viewAll: "Ver Todo",
        noActivitiesYet: "Aún no hay actividades",
        createAnActivity: "Crear una actividad",
        noUpcomingExpeditions: "No hay próximas expediciones",
        createAnExpedition: "Crear una expedición",
        
        // Access Restrictions
        accessRestricted: "Acceso Restringido",
        onlyMasterGuideAccess: "Solo el Guía Maestro puede acceder a la configuración del equipo.",
        viewOnlyMode: "Modo Solo Lectura",
        
        // Success/Error Messages
        teamCreatedSuccess: "¡Equipo creado con éxito!",
        teamNameUpdatedSuccess: "¡Nombre del equipo actualizado con éxito!",
        roleConfigUpdatedSuccess: "¡Configuración de roles del equipo actualizada con éxito!",
        teamActivatedSuccess: "¡Equipo activado con éxito!",
        teamDeactivatedSuccess: "¡Equipo desactivado con éxito!",
        teamDeletedSuccess: "¡Equipo eliminado con éxito!",
        memberRoleUpdatedSuccess: "¡Rol del miembro actualizado con éxito!",
        memberRemovedSuccess: "¡Miembro del equipo eliminado con éxito!",
        invitationGeneratedSuccess: "¡Código de invitación generado con éxito!",
        linkCopiedSuccess: "¡Enlace de invitación copiado al portapapeles!",
        
        fixValidationErrors: "Por favor, corrige los errores de validación antes de guardar."
      }
    }
  };
  
  export default translations;