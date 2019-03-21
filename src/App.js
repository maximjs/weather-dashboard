import React, { Component } from 'react';
import cn from 'classnames';
import ReactLoading from 'react-loading';
import styles from './App.module.sass';

const apiKey = 'ff143ed1daddb873cb08192d68e3aa1a';

class App extends Component {
  constructor(props) {
    super(props);
    const initData = JSON.parse(localStorage.getItem('cities'));
    this.state = {
        inputValue: '',
        isValidInput: null,
        isLoading: false,
        data: initData || [],
        error: '',
      };
  }

  handleInput = e => {
    const { value } = e.target;
    const isValid = this.validate(value);
    const message = (!isValid && value !== '') ? `Use only Latin letters and numbers` : '';
    this.setState({
      inputValue: value,
      isValidInput: value === '' ? null : isValid,
      error: message,
    });
  }

  validate = string => {
    return (string.search(/^[a-zA-Z0-9]+$/i) !== -1);
  }

  handleInputClear = () => {
    this.setState({ inputValue: '', isValidInput: null, error: '' });
  }

  handleDelete = id => () => {
    const { data } = this.state;
    const filteredData = data.filter(el => el.id !== id);
    this.saveToStorage(filteredData);
    this.setState({ data: filteredData });
  }

  saveToStorage = data => {
    const preparedData = JSON.stringify(data);
    localStorage.setItem('cities', preparedData);
  }

  handleAdd = () => {
    const { inputValue, isValidInput, data } = this.state;
    const isCityInData = data.findIndex(item => item.name.toLowerCase() === inputValue.toLowerCase()) !== -1;
    if (isCityInData) {
      const message = `The city ${inputValue} is already on the dashboard`;
      this.setState({ inputValue: '', isValidInput: null, error: message });
      return;
    }
    if (!inputValue || !isValidInput) {
      return;
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${inputValue}&units=metric&appid=${apiKey}`;
    this.setState({ isLoading: true, error: '' });
    fetch(url)
      .then(response => response.json())
      .then(resp => {
        if (resp.cod !== 200) {
          throw new Error(resp.message);
        }
        const dataResp = {
          id: resp.id,
          name: resp.name,
          temp: resp.main.temp,
          description: resp.weather[0].description,
          iconcode: resp.weather[0].icon,
        };
        const newData = [...data, dataResp];
        this.saveToStorage(newData);
        this.setState({
          isLoading: false,
          data: newData,
          inputValue: '',
          isValidInput: null,
        });
      })
      .catch(err => {
        this.setState({ isLoading: false, error: err.message });
      });
  }

  renderDashboard = () => {
    const { data } = this.state;
    return data.map(item => {
      const { id, name, temp, description, iconcode } = item;
      const sign = temp >= 0 ? '+' : '';
      const temperature = `${sign}${temp.toFixed(1)} ℃`;
      const iconUrl = 'http://openweathermap.org/img/w/' + iconcode + '.png';
      return (
        <div className={styles.weather} key={id}>
          <h3>{name}</h3>
          <div>{temperature}</div>
          <img src={iconUrl} alt={description} />
          <div onClick={this.handleDelete(id)} className={styles.weatherDelete}>Delete</div>
        </div>
      );
    });
  };

  renderEmpty = () => (
    <div className={styles.dashboardPlaceholder}>
      Dashboard is empty
    </div>
  );

  render() {
    const { inputValue, isValidInput, data, isLoading, error } = this.state;
    const inputClass = cn({
      [styles.input]: true,
      [styles.inputValid]: isValidInput === true,
      [styles.inputInvalid]: isValidInput === false,
    });
    return (
      <div className={styles.app}>
        <div className={styles.inputCity}>
          <input className={inputClass} onChange={this.handleInput} value={inputValue} placeholder="City..." />
          <button className={styles.inputCityAdd} onClick={this.handleAdd} disabled={isLoading}>Add</button>
          <button className={styles.inputCityDelete} onClick={this.handleInputClear} disabled={isLoading}>Clear</button>
          {error && <div className={styles.error}>{error}</div>}
          {isLoading && <ReactLoading type="spinningBubbles" color="grey" width="40" height="40" className={styles.loading} />}
        </div>
        <div className={styles.dashboard}>
          {data.length > 0 ? this.renderDashboard() : this.renderEmpty()}
        </div>
      </div>
    );
  }
}

export default App;
