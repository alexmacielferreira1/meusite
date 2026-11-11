import {BrowserRouter,Routes,Route,Navigate} from "react-router-dom";
import {StoreProvider} from "./lib/store";
import {Login,Signup} from "./pages/public/Auth";
import {Landing,ModelsPage,Example,Board,PublicBusiness,Preview,Legal} from "./business/Public";
import {Panel} from "./business/Panel";
export default function App(){return <StoreProvider><BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route index element={<Landing/>}/><Route path="modelos" element={<ModelsPage/>}/><Route path="entrar" element={<Login/>}/><Route path="cadastro" element={<Signup/>}/><Route path="privacidade" element={<Legal/>}/><Route path="termos" element={<Legal terms/>}/><Route path="exemplo/:modelo" element={<Example/>}/><Route path="pranchas/:numero" element={<Board/>}/><Route path="preview" element={<Preview/>}/><Route path="app/*" element={<Panel/>}/><Route path="p/:slug" element={<PublicBusiness/>}/><Route path=":slug" element={<PublicBusiness/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></BrowserRouter></StoreProvider>;}
