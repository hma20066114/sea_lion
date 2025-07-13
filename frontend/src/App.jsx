import ReactDOM, {createRoot} from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProductList from "./components/ProductList";

const App = () => {
  return (
    <ProductList />
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Layout>
//           <Routes>
//             <Route path="/product/list" element={<ProductList />} />
//             {/*<Route path="/products/new" element={<ProductEditor />} />*/}
//             {/*<Route path="/products/:id/edit" element={<ProductEditor />} />*/}
//
//             {/* --- NEW: Routes for dashboard pages --- */}
//             {/*<Route path="/warehouse" element={<PlaceholderPage title="Warehouse Management" icon={Warehouse} />} />*/}
//             {/*<Route path="/purchases" element={<PlaceholderPage title="Purchase Orders" icon={ShoppingCart} />} />*/}
//             {/*<Route path="/sales" element={<PlaceholderPage title="Sales Records" icon={DollarSign} />} />*/}
//           </Routes>
//       </Layout>
//     </BrowserRouter>
//   );
// }
//
// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);






