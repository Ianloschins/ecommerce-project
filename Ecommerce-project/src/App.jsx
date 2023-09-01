import React from "react";
import AllProducts from "./components/allProducts";
import '../src/components/main.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My Store</h1>
      </header>
      <main>
        <AllProducts />
      </main>
      <footer className="App-footer">
        <p>&copy; 2023 Ian Store. All rights reserved.</p>
      </footer>
    </div>
  )
}


export default App;