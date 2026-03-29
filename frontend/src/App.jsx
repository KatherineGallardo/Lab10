import React from 'react';
import axios from 'axios';
import './App.css';

// components 
import Header from './components/Header.jsx';
import Body from './components/Body.jsx';
import Footer from './components/Footer.jsx';

// Employee management app with CRUD operations

const App = () => {
  return (
    <div>
      <Header />
      <Body />
      <Footer />
    </div>

  );
};

export default App;