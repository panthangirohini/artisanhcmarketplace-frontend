import React from "react";
import { Icon, Logo } from "./ui";

// Split-screen shell for sign in / sign up: brand story on the left, form on the right
const AuthLayout = ({ children }) => (
  <div className="auth">
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <Logo light />
        <div className="auth-copy">
          <span className="eyebrow">Handmade in India</span>
          <h1>Every piece carries the <em>hands</em> that made it.</h1>
          <p>Pottery, handloom textiles, jewellery and folk art — bought directly from the artisans who craft them.</p>
        </div>
        <div className="auth-features">
          <div><span><Icon name="hand" size={17} /></span>Every item handmade, no two exactly alike</div>
          <div><span><Icon name="heart" size={17} /></span>Fair prices that go straight to the maker</div>
          <div><span><Icon name="truck" size={17} /></span>Free shipping on orders above ₹999</div>
        </div>
      </div>
    </aside>
    <main className="auth-main">
      <div className="auth-card">
        <div className="auth-mobile-logo"><Logo /></div>
        {children}
      </div>
    </main>
  </div>
);

export default AuthLayout;
