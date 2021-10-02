//db connection variable
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {

    const db = event.target.result;
 // create an object store (table) called `new_budget_item`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_budget_item', {autoIncrement: true});
};

//when the request is sucessful 
request.onsuccess = function(event) {
// when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

// check if app is online, if yes run  uploadBudgetItem() function to send all local db data to api
   if (navigator.onLine) {

    uploadBudgetItem();
   }
};

request.onerror = function(event) {
  //log any errors
  console.log(event.target.errorCode);
};

//Function that will execute if there is no internet connection
function saveRecord(item) {
     // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    // access the object store for `new_budget_item`
    const budgetObjectStore = transaction.objectStore('new_budget_item');
     // add record to your store with add method
    budgetObjectStore.add(item)
};

function uploadBudgetItem() {
    // open a transaction on your db
   const transaction = db.transaction(['new_budget_item'], 'readwrite');
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget_item');
    // get all records from store and set to a variable

     const getAll = budgetObjectStore.getAll();

 // with a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, send it to the api server using a POST request
        if (getAll.result.length > 0) {

            fetch('/api/transaction',
            {
              method: 'POST',
              body: JSON.stringify(getAll.result),
              headers: {
                  Accept: 'application/json, text/plain, */*',
                  'Content-Type': 'application/json'
              }  
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_budget_item'], 'readwrite');
                // access the new_budget_item object store
                const budgetObjectStore = transaction.objectStore('new_budget_item');
                // clear all items in your store
                budgetObjectStore.clear();

                alert('Offline Budget Items Have Been Submited!')
            })
            .catch(err => {
          console.log(err);
                });
        }
    };
};

// listen for app coming back online
window.addEventListener('online', uploadBudgetItem);