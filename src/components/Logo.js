const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <svg
        className="w-8 h-8 text-purple-600"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <span className="text-2xl font-bold text-gray-900">Skiddly</span>
    </div>
  );
};

export default Logo;
