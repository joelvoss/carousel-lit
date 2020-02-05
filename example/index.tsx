import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import { Carousel, Track, Previous, Next } from '../src/index';
import { items } from './fixtures';

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.25rem 0',
};

const buttonStyle = {
  fontSize: '1rem',
  border: '1px solid #333',
  borderRadius: '3px',
  padding: '0.25rem 0.5rem',
};

const Example = () => {
  return (
    <Carousel>
      <Track data={items}>
        {({ entry, last }) => (
          <div
            key={entry.id}
            style={{
              flex: '0 0 200px',
              width: '200px',
              height: '150px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: entry.color,
              margin: `${last ? '0' : '0 0.25rem 0 0'}`,
            }}
          >
            {entry.color}
          </div>
        )}
      </Track>

      {/*
        Render 
      */}
      <div style={row}>
        <Previous style={buttonStyle}>{'←'}</Previous>
        <Next style={buttonStyle}>{'→'}</Next>
      </div>
    </Carousel>
  );
};

ReactDOM.render(<Example />, document.getElementById('root'));
