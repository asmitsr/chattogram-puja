import { Fragment } from 'react';

// সহজ লেখার চিহ্ন → মোটা / লাল / বাঁকা (কোনো HTML ঢোকানো হয় না, তাই নিরাপদ)
//   **মোটা**   ~~লাল মোটা~~   __বাঁকা__   ^^লাল মোটা বাঁকা^^   \n = নতুন লাইন
const TOKEN = /(\*\*[^*]+\*\*|~~[^~]+~~|__[^_]+__|\^\^[^^]+\^\^)/g;

export default function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(TOKEN).map((part, i) => {
            if (part.startsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>;
            if (part.startsWith('~~')) return <b key={i} className="pd-red">{part.slice(2, -2)}</b>;
            if (part.startsWith('__')) return <i key={i}>{part.slice(2, -2)}</i>;
            if (part.startsWith('^^')) return <b key={i} className="pd-red pd-it">{part.slice(2, -2)}</b>;
            return <Fragment key={i}>{part}</Fragment>;
          })}
        </Fragment>
      ))}
    </>
  );
}
