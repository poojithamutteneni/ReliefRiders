import React, { useEffect, useState } from "react";
import ChooseRequestItem from "./chooseRequestItem";
import styles from "./ChooseRequest.module.css";
import axios from "axios";
import { Dialog } from "../../global_ui/dialog/dialog";
import { LoadingScreen } from "../../global_ui/spinner";

const ChooseRequest = () => {
  const [sliderValue, setSliderValue] = useState(1);
  const [allRequests, setRequests] = useState(request);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState(0);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const token = localStorage.getItem("token");
    
  //sorting requests based on 3 parameters.
  function sortedCustom(param) {
    setFlag(flag + 1);
    let a = request;

    if (param == "Date") {
      a.sort(comparisonByDate);
      setRequests(a);
    } else if (param == "Priority") {
      a.sort(comparisonByPriority);
      setRequests(a);
    } else if (param == "Distance") {
      a.sort(comparisonByDistance);
      setRequests(a);
    }
  }

  //finding current location of rider
  const currentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
      navigator.permissions.query({ name: "geolocation" }).then((res) => {
        if (res.state === "denied") {
          console.log("Location Permission denied");
          alert("Please allow location permission");
        }
      });
    }
  };

  //Comparison function for sorting by distance
  function comparisonByDistance(a, b) {
    return a.distance - b.distance;
  }
  //Comparison function for sorting by date
  function comparisonByDate(dateA, dateB) {
    var c = new Date(dateA.date);
    var d = new Date(dateB.date);
    return c - d;
  }
  //Comparison function for sorting by priority or urgency
  function comparisonByPriority(a, b) {
    return b.priority - a.priority;
  }

  //Calculating distance between rider's current location and roughLocationCoordinates using google maps api
  function calculateDistance(request,i) {
    let distance1;
    let URL = 
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${coordinates.lat},${coordinates.lng}&destinations=${request.roughLocationCoordinates[0]},${request.roughLocationCoordinates[1]}&key=${process.env.REACT_APP_GMAP_API_KEY}`;
    console.log("Entered");
    
    axios.get(URL)
      .then((response) => {
        console.log(response,16);
        distance1 = response.data.rows[0].elements[0].distance.value;
        allRequests[i].distance = distance1/1000;
      })
      .catch((error) => {
        console.log(error,1010);
      });
      console.log("f*",distance1);
  }
  //calling calculate distance function for each request
  function assignDistance() {
    let i;
    for (i = 0; i < request.length; i++) {
      calculateDistance(request[i],i);
    }
  }
  useEffect(() => {
    console.log("Changing Distance");
    assignDistance();
    console.log('Changed');
  }, [coordinates]);

  useEffect(() => {
    console.log(allRequests,11);
    setLoading(true);
    currentLocation();
    const options = {
      headers: {
        authorization: "Bearer " + token,
      },
    };
    
    //stub to test
    let data = request;
    for (let i = 0; i < data.length; i++) {
      data[i].distance = 10;
    }   
    setRequests(data);     
    setLoading(false); 
  
    axios.get(`${process.env.REACT_APP_URL}/rider/makeDelivery`, options)
    .then((response) => {
        if(response.data.message.length === 0) {  
          setLoading(false)        
          setError("Could not fetch Data");
        } 
        else{
          let data = response.data.message;
          for (let i = 0; i < data.length; i++) {
            data.distance = 0;
          }   
          setRequests([data]);     
          setLoading(false);
        }    
            
      },
    )
    .catch((error) => {
        setError(error.message);
        setLoading(false);
      }
    )
    .finally(
      ()=>setLoading(false)
    )

  }, []);

  return loading ? (
    <LoadingScreen />
  ) : (
    <>
      <Dialog
        isShowing={error}
        onOK={() => {
         // history.goBack();
          setError(null);
        }}
        msg={error}
      />

      <div className={styles.container}>
        <div className={styles.navbar}>

          <div className={styles.backbtn}>
            <i className="fas fa-chevron-left"></i>
          </div>

          <h3 className={styles.title}>Requests</h3>

          <div className={styles.dropdown}>

            <button className={styles.dropbtn}>
              Order By
              <i className="fa fa-caret-down"></i>
            </button>

            <div className={styles.dropdownContent}>
              <button
                className={styles.buttons}
                onClick={() => sortedCustom("Date")}>
                Date
              </button>

              <button
                className={styles.buttons}
                onClick={() => sortedCustom("Distance")}>
                Location
              </button>

              <button
                className={styles.buttons}
                onClick={() => sortedCustom("Priority")}>
                Urgency
              </button>
            </div>

          </div>

        </div>

        <div className={styles.rangeSlider}>
          Distance:
          <input
            className={styles.slider}
            type="range"
            min="1"
            max="100"
            value={sliderValue}
            onChange={({ target: { value: radius } }) => {
              setSliderValue(radius);
            }}
          />
        </div>

        <div className={styles.bubble} id="bubble">
          Upto {sliderValue} Kilometres
        </div>

        {
          allRequests.length === 0 ? 
          (
            <h3 className={styles.noRequests}>There are no new Requests.</h3>
          ):
          (
            <div className={styles.ChooseRequestItem}>
              {
                allRequests.map((req) => {
                  return (
                    <ChooseRequestItem
                      sliderValue = {sliderValue}
                      obj = {allRequests}
                      key={req.requestNumber}
                      data={req}
                    />
                  );
                })
              }
            </div>
          )
        }
      </div>
    </>
  );
};

export default ChooseRequest;

const request = [
  {   
    date: "7/7/2022",
    requestNumber: "12345",
    requesterID: "777777",
    riderID: "5678",
    noContactDelivery: "true",
    requestStatus: "PENDING",
    requestType: "P&D",
    itemCategories: ["MEDICINES"],
    remarks: "Use back gate",
    billsImageList: ["some link"],
    rideImages: ["some link"],
    roughLocationCoordinates: [17.449009453401768, 78.39147383021886],
    pickupLocationCoordinates: {
      coordinates: [37.7680296, -122.4375126],
    },
    pickupLocationAddress: {
      address: "12-4-126/7",
      area: "SR Nagar",
      city: "Hyderabad",
    },
    dropLocationCoordinates: {
      coordinates: [37.7680296, -122.4375126],
    },
    dropLocationAddress: {
      addressLine: "6736BH",
      area: "SR Nagar",
      city: "Hyderabad",
    },
    priority: "15",
    requesterName: "Pranchal Agarwal",
  },
  {
   
    date: "7/7/2002",
    requestNumber: "945",
    requesterID: "72377",
    riderID: "56789",
    requestStatus: "PENDING",
    requestType: "P&D",
    paymentPreference: "CASH",
    itemsListImages: ["somelink"],
    itemsListList: [{ itemName: "tomato", quantity: "2kg" }],
    itemCategories: ["GROCERIES", "MISC"],
    roughLocationCoordinates: [17.46415683066205, 78.38748270276933],
    pickupLocationCoordinates: {
      coordinates: [37.7680296, -122.4375126],
    },
    pickupLocationAddress: {
      address: "12-4-126/7",
      area: "SR Nagar",
      city: "Hyderabad",
    },
    dropLocationCoordinates: {
      coordinates: [37.7680296, -122.4375126],
    },
    dropLocationAddress: {
      addressLine: "6736BH",
      area: "B.Hills",
      city: "Hyderabad",
    },
    requesterName: "Some Name",
    priority: "12",
  },
  {
   
    date: "7/5/2021",
    requestNumber: "1245",
    requesterID: "727777",
    riderID: "156789",
    requesterCovidStatus: "true",
    requestStatus: "PENDING",
    requestType: "General",
    itemCategories: ["GROCERIES", "MEDICINES", "MISC"],
    roughLocationCoordinates: [17.44410138800549, 78.36501180995198],
    pickupLocationCoordinates: {
      coordinates: [17.9, 78.6],
    },
    dropLocationCoordinates: {
      coordinates: [17.9, 78.6],
    },
    dropLocationAddress: {
      addressLine: "6736BH",
      area: "SR NAGAR",

      city: "Hyderabad",
    },
    priority: "20",
    requesterName: "Pranchal",
  },
  {
   
    date: "7/9/2031",
    requestNumber: "2345",
    requesterID: "7777787",
    riderID: "1562789",
    requestStatus: "PENDING",
    requestType: "General",
    itemCategories: ["MISC"],
    roughLocationCoordinates: [17.431572809383972, 78.3681875451749],
    pickupLocationCoordinates: {
      coordinates: [17.9, 78.6],
    },
    dropLocationAddress: {
      addressLine: "6736BH",
      area: "SR Nagar",

      city: "Hyderabad",
    },
    dropLocationCoordinates: {
      coordinates: [17.9, 78.6],
    },
    priority: "0",
    requesterName: "name",
  },
];