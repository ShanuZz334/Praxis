const SectorWidget = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">
        Sector Performance
      </h2>

      <div className="bg-black/20 border border-white/10 rounded-xl p-4 h-80 overflow-y-auto backdrop-blur-xl invisibleScroll">
        {data.map((sec) => {
          const positive = sec.change >= 0;

          return (
            <div
              key={sec.name}
              className="flex justify-between items-center py-2 border-b border-white/10"
            >
              <span className="text-white">{sec.name}</span>

              <span
                className={
                  positive ? "text-green-400" : "text-red-400"
                }
              >
                {positive ? "+" : ""}
                {sec.change}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectorWidget;
