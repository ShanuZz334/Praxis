import React from "react";
import ColorBends from "./ColorBends";
console.log("AuthBackground mounted");


const AuthBackground = () => {
  return (
    <div className="fixed inset-0 z-0 ">
      <ColorBends
        colors={["red", "violet", "#6D28FF"]}
        rotation={18}
        speed={0.15}
        scale={1.1}
        frequency={2}
        warpStrength={1.1}
        mouseInfluence={0.22}
        parallax={0.3}
        noise={0.05}
        transparent
      />
    </div>
  );
};

export default AuthBackground;
