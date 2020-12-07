var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var db = require('./db');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'XASDASDA',
    resave: true,
    saveUninitialized: true
}));

app.set('view engine','ejs');

app.use(function (req, res, next) {
    res.locals = {
        flights_authentication: false, 
        data_flights: "",
        seats: 0,
        total_passenger: 1
    };
    next();
});

app.get('/', function(request,response){
    flights_authentication = false;
    var query_airports_string = "select * from airport;";
    db.query(query_airports_string,function(error,query_result_airport){
        response.render('search',{airport_data: query_result_airport,noflights: false});
    });
});

app.post('/',function(request,response){
    var origin_city_code = request.body.origin_city_code;
    var destination_city_code = request.body.destination_city_code;
    var query_string_flights = "select * from flights where departure_airport = '" + origin_city_code + "' and arrival_airport = '" + destination_city_code + "';";
    db.query(query_string_flights, function(error,query_result_flights){
        var negative_seats_count = 0;
        for(var i = 0;i < query_result_flights.rowCount;i++){
            if(query_result_flights.rows[i].seats_available - request.body.seats < 0)
                negative_seats_count++;
        }
        if(query_result_flights.rowCount == 0 || negative_seats_count == query_result_flights.rowCount){
            var query_airports_string = "select * from airport;";
            db.query(query_airports_string,function(error,query_result_airport){
                response.render('search',{airport_data: query_result_airport,noflights: true});
            });
            return;
        }
        data_flights = query_result_flights;
        seats = request.body.seats;
        flights_authentication = true;
        response.redirect('flights');
    });
});

app.get('/flights',function(request,response){
    if(flights_authentication == false){
        response.redirect('/');
        return;
    }
    response.render('flights',{data_flights:data_flights,seats:seats});
});

app.get('/payment',function(request,response){
    response.redirect('/');
});

app.post('/payment',function(request,response){
    console.log('seats:' + seats);
    var total_amount = 200 * seats;
    response.render('payment',{total_amount:total_amount, flight_id:request.body.flight_id});
});

app.post('/booking_number',function(request,response){
    console.log("booking");
    //Add code to validate the input such as card number,email,phonenumber,and name
    

    var query_insert_payment = "insert into bookings(book_date,flight_path_type,card_number,taxes,discounts,total_amount) values('2021/12/12/','direct','" + request.body.credit_card + "',0,0," + request.body.total_amount + ") RETURNING id;";
    db.query(query_insert_payment,function(error,query_result_payment){
        if(error) throw error;
        //add ticket * seats 
        var update_flight = "update flights set seats_available = seats_available - "+ seats +", seats_booked = seats_booked + "+ seats +" where flight_id= "+request.body.flight_id+"; "
        db.query(update_flight,function(err,query_result_flight){
            if(err) throw err;
            
            //var query_insert_ticket = "insert into ticket(ticket_no,id,passenger_id,passenger_name,email, phone) values('2020-10-20','direct','" + request.body.credit_card + "',0,0," + request.body.total_amount + ") RETURNING id;";
            //add ticket_flight * seats        
        });
    });
    response.render('booking_number');
});

app.get('*', function(request, response){
    console.log("redirect");
    response.redirect('/');
});

app.listen(3000);






