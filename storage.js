function getData(){return JSON.parse(localStorage.getItem('cinepipoca'))||[]}
function saveData(data){localStorage.setItem('cinepipoca',JSON.stringify(data))}