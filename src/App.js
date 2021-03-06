import React, { Component } from 'react';
import LoginSignup from './containers/LoginSignup/LoginSignup';
import DefaultContainer from './hoc/DefaultContainer/DefaultContainer';
import { userContext } from './hoc/Context/UserContext';
import axios from 'axios';

import { Route, BrowserRouter, Switch } from 'react-router-dom';
import Record from './containers/Record/Record';
import Evaluate from './containers/Evaluate/Evaluate';

class App extends Component {

  state = {
    user: {
      username: null,
      email: null
    }
  }


  componentDidMount () {
    
    axios.get('/api/users/loggedin')
      .then(response => {
        this.setState({
          user: response.data.user
        });
      });
    
  }

  login = (email, password) => {

    axios.post(
      '/api/users/login', 
      {
          email: email,
          password: password
      })
      .then( response => {
        this.setState({
          user: response.data.user
        });
        window.location.href = '/';
      })
      .catch(error => {
        alert(error.response.data.message);
        window.location.reload();
      });

  }

  logout = () => {

    console.log('logout');

    axios.get('/api/users/logout')
      .then(response => {
        console.log(response.data.message);
        this.setState({
          user: {
            username: null,
            email: null
          }
        });
      });

    window.location.href = '/';

  }

  signup = (username, email, password, nationality, age, sex) => {

    const user = {
                    username: username,
                    email: email,
                    password: password,
                    nationality: nationality,
                    age: age,
                    sex: sex
                };

    axios.post(
      '/api/users/signup', 
      user)
      .then(response => {
        alert(response.data.message);
        window.location.reload();
      })
      .catch(error => {
        alert(error.response.data.message);
      });

  } 

  render() {

    const value = {
      user: this.state.user,
      logout: this.logout
    }

    return (
      <userContext.Provider value={value}>
        <BrowserRouter>
          <Switch>
            <Route path="/login-signup"
              component={ () => <LoginSignup login={this.login} signup={this.signup}/> }/>
            <Route path="/record" component={Record}/>
            <Route path="/evaluate" component={Evaluate}/>  
            <Route component={DefaultContainer} />
          </Switch>
        </BrowserRouter>
      </userContext.Provider>
    );
  }
}

export default App;
