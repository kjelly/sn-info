import React from 'react';
import BridgeManager from '../lib/BridgeManager';
import moment from 'moment';

const DATE_FORMAT = /[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}/g;

function getCheckboxItemWithTime(text){
  var lines = text.match(/[^\r\n]+/g) || [];
  var ret = []
  lines.forEach(function(line){
    if(!line.includes('[ ]')){
      return
    }
    const dates = (line.match(DATE_FORMAT) || []).map(function(t){return Date.parse(t)}).sort()
    if(dates.length == 0){
      return
    }
    var index = line.indexOf(']')
    const title= line.substring(index + 1).trim()
    ret.push([title, dates[0]])
  })
  return ret
}

function getItems(text){
  var items = (text.match(/[ \t]*[-*] .+\n/g) || []).map( l => l.trim())
  console.log(items)
  var dict = {}
  items.forEach(function(item){
    const index = item.indexOf(',')
    if(index == -1){
      return
    }
    const key = item.substring(2, index)
    const dates = (item.match(DATE_FORMAT) || []).map(function(t){return Date.parse(t)}).sort()
    if(dates.length == 0){
      return
    }
    if(key in dict){
      if(dates[0] > dict[key]){
        dict[key] = dates[0]
      }
    }else{
      dict[key] = dates[0]
    }
  })
  return dict
}

function parseTimes(text){
  // var items = (text.match(/\w+\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g) || []).map( l => l.trim())
  var items = (text.match(RegExp('\\S+\\(' + DATE_FORMAT.source + '\\)', 'g')) || []).map( l => l.trim())
  console.log(items)
  var ret = []
  items.forEach(function(item){
    const index = item.indexOf('(')
    if(index == -1){
      return
    }
    const title= item.substring(0, index)
    const dates = (item.match(DATE_FORMAT) || []).map(function(t){return Date.parse(t)}).sort()
    if(dates.length == 0){
      return
    }
    ret.push([title, dates[0]])
  })
  return ret
}

function timeSince(date) {

  var seconds = Math.floor((Date.now() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

export default class Home extends React.Component {

  constructor(props) {
    super(props);

    this.state = {};

    BridgeManager.get().addUpdateObserver(() => {
      this.setState({note: BridgeManager.get().getNote()});
    })
  }

  render() {
    var text = null;
    var todoCount, doingCount,doneCount, uncheckCount, checkCount, dates, humanTime;
    var pass=[], upcoming=[], dateWithCheckbox=[], dict={}, dictOutput=[];
    if(this.state.note){
      text = this.state.note.content.text;
      todoCount = (text.match(/TODO/g) || []).length;
      doingCount = (text.match(/DOING/g) || []).length;
      doneCount = (text.match(/DONE/g) || []).length;
      checkCount = (text.match(/\[x\]/g) || []).length;
      uncheckCount = (text.match(/\[ \]/g) || []).length;
      dates = (text.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g) || []).map(function(t){return Date.parse(t)}).sort();
      var now = Date.now();
      var items= parseTimes(text)
      items.forEach((t)=> {
        var m = moment(t[1])
        var temp = (<div className='item' style={{flex:1}}> {t[0]} : {m.fromNow()}<div className='info'>({m.format('YYYY-MM-DD')})</div> </div>)
        if(m > now){
          upcoming.push(temp);
        }else{
          pass.push(temp)
        }
      })

      dateWithCheckbox = getCheckboxItemWithTime(text).map((item) => {
        var m = moment(item[1])
        return (<div className='item' style={{flex:1}}> {item[0]} : <div className='info'> {m.fromNow()}</div> </div>)
      })

      dict = getItems(text)

      var sortable = []
      for(var key in dict){
        sortable.push([key, dict[key]])
      }

      var sorted = sortable.sort(function(a, b) {
        return a[1] - b[1];
      });

      dictOutput = sorted.map((item) => {
        var m = moment(item[1])
        return (<div className='item' style={{flex:1}}> {item[0]}: <div className='info'>{m.fromNow()}</div></div>)
      })

      console.log(dictOutput)

      return (
        <div>
          <div>INFO:</div>
          {this.state.note &&
            <div>
              { (todoCount > 0 || doingCount > 0 || doneCount > 0) &&
                <div className="container">
                  <div style={{flex:1, color: '#FFEFD5'}}>TODO: {todoCount}</div>
                  <div style={{flex:1, color: '#FFEFD5'}}>DOING:{doingCount}</div>
                  <div style={{flex:1, color: '#FFEFD5'}}>DONE:{doneCount}</div>
                </div>
              }
              { (checkCount > 0 || uncheckCount > 0) &&
                 <div className="container">
                  <div style={{flex:1, color: '#F0F8FF'}}>CHECK:{checkCount}</div>
                  <div style={{flex:1, color: '#F0F8FF'}}>UNCHECK:{uncheckCount}</div>
                 </div>
              }
              <div className="container">
                { upcoming.length > 0 &&
                  <div className="col" style={{flex:1}}>
                    <div style={{flex:1, color: 'red'}}> UPCOMING: </div>
                      {upcoming}
                  </div>
                }
                { pass.length > 0 &&
                  <div className="col" style={{flex:1}}>
                    <div style={{flex:1, color: '#98F5FF'}}> PASS: </div>
                      {pass}
                  </div>
                }
                { dateWithCheckbox.length > 0 &&
                  <div className="col" style={{flex:1}}>
                    <div style={{flex:1, color: 'green'}}>CHECKBOX: </div>
                      {dateWithCheckbox}
                  </div>
                }
                { dictOutput.length > 0 &&
                  <div className="col" style={{flex:1}}>
                    <div style={{flex:1, color: '#FcD3A4'}}> HISTORY: </div>
                      {dictOutput}
                  </div>

                }
              </div>
            </div>
          }
        </div>
      )
    }

    return (<div>Loading</div>);
  }

}
