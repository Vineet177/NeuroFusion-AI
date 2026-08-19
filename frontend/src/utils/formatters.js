export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const formatPercent = (val) => {
  return `${Math.round(val)}%`;
};

export const getRiskBadgeColor = (score) => {
  if (score < 25) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score < 55) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (score < 75) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
};
