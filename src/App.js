import './App.css';
import DropZone from './components/DropZone';
import info from './info.svg';
import icon from './twitch-emote-resizer.svg';
import github from './github.svg';

function App() {
  const handleViewOnGithub = () => {
    window.location.href = "https://github.com/tma02/twitch-emote-resizer";
  };
  return (
    <div className="App">
      <div className="TitleRow">
        <img className="Icon" src={icon} />
        <div className="Title">Twitch Emote Resizer</div>
      </div>
      <DropZone />
      <div className="Info">
        <img src={info} className="InfoIcon" alt="info icon" />
        <p>
          This site will resize an image into sizes for Twitch emotes and badges, Discord, YouTube, and Facebook.
          <br />
          If a resized image exceeds the 25KB limit used by Twitch assets, this site will attempt to compress it.
          <br />
          Image processing is done in your browser. Your image never leaves your device.
        </p>
      </div>
    </div>
  );
}

export default App;
