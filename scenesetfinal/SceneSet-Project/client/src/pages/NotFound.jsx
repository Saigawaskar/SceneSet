import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return <div className="not-found-page"><Link to="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={20}/></span><span className="brand-name">scene<span>set</span><i>.</i></span></Link><div className="not-found-art">4<span>✳</span>4</div><h1>This scene doesn’t exist.</h1><p>Wrong turn, or maybe the plan took a different route.</p><Link to="/" className="button button-primary"><ArrowLeft size={16}/> Back to SceneSet</Link></div>;
}
