//import button from Asgardeo 
import { SignInButton, SignOutButton, SignedIn, SignedOut } from '@asgardeo/react';

const Header = () => {
  return (
    <header className="header">
      <h1>Puppies</h1>

      {/* create container for auth buttons so spacing with sign-in button is better */}
      <div className="auth-container">
        {/* show sign in button if not signed in */}
        <SignedOut>
          <SignInButton className="btn-primary" />
        </SignedOut>

        {/* show signout button if signed in */}
        <SignedIn>
          <SignOutButton className="btn-danger" />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;