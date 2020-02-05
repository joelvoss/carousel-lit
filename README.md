# Basic Example

Lit carousel component written in React.

## Install

```text
npm install carousel-lit  OR  yarn add carousel-lit
```

## Example

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Carousel, Track, Previous, Next } from 'carousel-lit';

const items = [
  { id: 'id-0', color: 'aliceblue' },
  { id: 'id-1', color: 'antiquewhite' },
  { id: 'id-2', color: 'aqua' },
];

const itemStyle = {
  flex: '0 0 200px',
  width: '200px',
  height: '150px',
};

const App = () => {
  return (
    <Carousel>
      {/*
        Pass your items to the <CarouselTrack> component and leverage the
        render prop api to render your custom carousel item.
      */}
      <Track data={items}>
        {({ entry, index, first, last }) => (
          <div
            key={`${entry.id}-${index}`}
            style={{
              ...itemStyle,
              backgroundColor: entry.color,
              margin: `${last ? '0' : '0 0.25rem 0 0'}`,
            }}
          >
            I am {entry.color}
          </div>
        )}
      </Track>

      {/*
        Render previous and next buttons wherever you like as long as they
        are a decendent of <Carousel>
      */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Previous>{'←'}</Previous>
        <Next>{'→'}</Next>
      </div>
    </Carousel>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
```

Have a look inside the `example/` directory to learn more about possible usage
patterns.

> Note: This component requires and includes both `resize-observer-polyfill` and
> `smoothscroll-polyfill`.

## API

> Under construction

## Local development

1. Clone this repository and install it's dependencies

   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install
   ```

2. Validate project setup

   ```bash
   # Using npm
   npm run validate

   # Using yarn
   yarn validate
   ```

3. Navigate into the `example/` folder to start your local development
   environment.

   ```bash
   cd ./example

   # Using npm
   npm install && npm start

   # Using yarn
   yarn install && yarn start
   ```

   This will start a simple React application powered by Parcel on `http://localhost:1234`.

---

This project was bootstrapped with [jvdx](https://github.com/joelvoss/jvdx).
