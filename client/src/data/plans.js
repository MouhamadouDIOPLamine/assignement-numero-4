// Membership tiers as an array of objects (pricing cards are mapped from here).
export const plans = [
  {
    id: 1,
    name: 'Starter',
    price: 29,
    featured: false,
    features: ['4 classes per month', 'Access to open gym', 'Mobile app check-in'],
  },
  {
    id: 2,
    name: 'Pro',
    price: 59,
    featured: true,
    features: ['Unlimited classes', '1 personal session / month', 'Guest passes included'],
  },
  {
    id: 3,
    name: 'Elite',
    price: 99,
    featured: false,
    features: ['Everything in Pro', 'Weekly personal training', 'Nutrition coaching'],
  },
]
