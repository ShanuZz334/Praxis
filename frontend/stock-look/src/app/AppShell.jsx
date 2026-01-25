import React from "react";

const AppShell = ({ children }) => {
  return (
    <main
      className="
        flex-1
        px-4 sm:px-6 lg:px-8
        py-6
        max-w-[1600px]
        mx-auto
        w-full
      "
    >
      {children}
    </main>
  );
};

export default AppShell;
