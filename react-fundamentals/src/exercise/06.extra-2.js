import * as React from 'react'

function UsernameForm({onSubmitUsername}) {
  const inputRef = React.useRef()
  const [error, setError] = React.useState(null)

  const handleSubmit = e => {
    e.preventDefault()
    onSubmitUsername(inputRef.current.value)
  }

  const handleChange = e => {
    const {value} = e.target
    const isValid = value === value.toLowerCase()
    setError(isValid ? null : 'Username must be lower case')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          ref={inputRef}
          onChange={handleChange}
        />
      </div>
      {error && (
        <div style={{color: 'red'}} role="alert">
          {error}
        </div>
      )}
      <button type="submit" disabled={!!error}>
        Submit
      </button>
    </form>
  )
}

function App() {
  const onSubmitUsername = username => alert(`You entered: ${username}`)
  return <UsernameForm onSubmitUsername={onSubmitUsername} />
}

export default App
