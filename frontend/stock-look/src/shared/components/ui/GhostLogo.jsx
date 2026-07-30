import React from 'react';
import './GhostLogo.css';
import './GhostAccessories.css';
import { useTheme } from '../../context/ThemeContext';

const GhostLogo = ({ className, style, status = 'idle', accessory, animated = true }) => {
  const { paiAccessory } = useTheme();
  const currentAccessory = accessory || paiAccessory || 'none';
  
  return (
    <div className={`ghost-logo-container ${className || ''} ${!animated ? 'not-animated' : ''}`} style={style}>
      <div id="ghost">
        <div id="red">
          <div id="pupil"></div>
          <div id="pupil1"></div>
          <div id="eye"></div>
          <div id="eye1"></div>
          <div id="h1"></div>
          <div id="h2"></div>
          <div id="h3"></div>
          <div id="h4"></div>
          <div id="h5"></div>
          <div id="h6"></div>
          <div id="h7"></div>
          <div id="h8"></div>
          <div id="mouth" className={status}></div>
          <div id="hand-l"></div>
          <div id="hand-r"></div>

          {/* ACCESSORIES LAYER */}
          {currentAccessory === 'helmet' && <div id="acc-helmet"></div>}
          {currentAccessory === 'chain' && <div id="acc-chain"><div className="c1"/></div>}
          {currentAccessory === 'tie' && <div id="acc-tie"><div className="t1"/><div className="t2"/></div>}
          {currentAccessory === 'hair' && <div id="acc-hair"><div className="h-left"/><div className="h-mid"/><div className="h-right"/></div>}
          {currentAccessory === 'crown' && <div id="acc-crown"></div>}
          {currentAccessory === 'glasses' && <div id="acc-glasses"><div className="g-l"/><div className="g-r"/><div className="g-mid"/></div>}
          {currentAccessory === 'bowtie' && <div id="acc-bowtie"></div>}
          {currentAccessory === 'headband' && <div id="acc-headband"><div className="band"/><div className="tail"/></div>}
          {currentAccessory === 'headphones' && <div id="acc-headphones"><div className="hp-band"/><div className="hp-l"/><div className="hp-r"/></div>}

          <div id="top0"></div>
          <div id="top1"></div>
          <div id="top2"></div>
          <div id="top3"></div>
          <div id="top4"></div>
          <div id="st0"></div>
          <div id="st1"></div>
          <div id="st2"></div>
          <div id="st3"></div>
          <div id="st4"></div>
          <div id="st5"></div>
          <div id="an1"></div>
          <div id="an2"></div>
          <div id="an3"></div>
          <div id="an4"></div>
          <div id="an5"></div>
          <div id="an6"></div>
          <div id="an7"></div>
          <div id="an8"></div>
          <div id="an9"></div>
          <div id="an10"></div>
          <div id="an11"></div>
          <div id="an12"></div>
          <div id="an13"></div>
          <div id="an14"></div>
          <div id="an15"></div>
          <div id="an16"></div>
          <div id="an17"></div>
          <div id="an18"></div>
        </div>
        <div id="shadow" style={{ display: status === 'idle' ? 'block' : 'none' }}></div>
      </div>
    </div>
  );
};

export default GhostLogo;
