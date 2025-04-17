export const getMonthlyCount = (dataArray, valueKey = "count") => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
  
    return Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(currentMonth - 5 + i);
      const label = months[date.getMonth()];
      const found = dataArray.find(
        (entry) =>
          entry._id.year === date.getFullYear() &&
          entry._id.month === date.getMonth() + 1
      );
      return {
        month: label,
        count: found?.[valueKey] || 0,
      };
    });
  };
  