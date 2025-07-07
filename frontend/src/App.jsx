import { createRoot } from "react-dom/client";
import ProductList from "./components/ProductList";

const App = () => {
  return (
    <ProductList />
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);


