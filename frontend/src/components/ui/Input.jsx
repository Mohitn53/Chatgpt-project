export default function Input({ label, type = "text", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        type={type}
        className="
          bg-transparent
          border border-white/20
          rounded-lg
          px-4 py-2
          text-white
          placeholder-gray-400
          outline-none
          focus:border-blue-500
          focus:ring-1 focus:ring-blue-500
          transition
        "
        {...props}
      />
    </div>
  );
}
