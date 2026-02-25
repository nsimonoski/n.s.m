import './app.scss';
import { CodeEditor } from '@org/react-code-editor';

export function App() {
  return (
    <div className="ide-shell">
      <div className="sidebar-placeholder" />
      <div className="editor-area">
        <CodeEditor />
      </div>
    </div>
  );
}

export default App;
