// ===================================================================
// Donnees de secours (fallback) uniquement. Les cours affiches viennent
// desormais de l'API (/api/classes). Ce fichier n'est plus importe par
// la grille ; il sert de reference et pour le seed cote serveur.
// ===================================================================

export const categories = ['All', 'HIIT', 'Yoga', 'Strength', 'Cardio']

export const classes = [
  { id: 1, name: 'Sunrise HIIT',  category: 'HIIT',     day: 'Mon', time: '07:00', trainer: 'Maya Okoro',  duration: 45 },
  { id: 2, name: 'Power Yoga',    category: 'Yoga',     day: 'Tue', time: '09:30', trainer: 'Leo Martins', duration: 60 },
  { id: 3, name: 'Express Core',  category: 'HIIT',     day: 'Wed', time: '12:15', trainer: 'Maya Okoro',  duration: 30 },
  { id: 4, name: 'Strength 101',  category: 'Strength', day: 'Thu', time: '17:30', trainer: 'Sara Lind',   duration: 50 },
  { id: 5, name: 'Spin & Burn',   category: 'Cardio',   day: 'Fri', time: '18:45', trainer: 'Maya Okoro',  duration: 45 },
  { id: 6, name: 'Mobility Flow', category: 'Yoga',     day: 'Sat', time: '10:00', trainer: 'Leo Martins', duration: 40 },
  { id: 7, name: 'Deadlift Lab',  category: 'Strength', day: 'Sat', time: '11:30', trainer: 'Sara Lind',   duration: 55 },
  { id: 8, name: 'Tabata Rush',   category: 'Cardio',   day: 'Sun', time: '09:00', trainer: 'Maya Okoro',  duration: 30 },
]
