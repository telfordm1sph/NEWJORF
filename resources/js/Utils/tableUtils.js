export const renderValue = (v) => (v === null || v === "" ? "—" : v);

export const formatCurrency = (value) => {
    if (value == null) return "—";
    return `₱${parseFloat(value)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};
