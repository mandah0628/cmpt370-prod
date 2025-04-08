const { sequelize, Reservation } = require('../model/index');
const{
    // create operations
    addReservationDb,
    // get operations 
    getMyReservationsDb, getReservationByIdDb,
    // delete operations
    deleteReservationDb,
} = require('../data/reservationData');

const jwt = require('jsonwebtoken');

// creates a reservation entry in the 'reservations' table
const addReservation = async (req,res) => {
    let transaction;
    try {

        // EXTRACT ALL THE DATA
        const userId = req.user.id;
        const reservationData = { ...req.body, userId}

        // start transaction
        transaction = await sequelize.transaction();

        // 1) create the reservation in db
        await addReservationDb(reservationData, transaction);

        // 2) commit transaction
        await transaction.commit();

        res.status(200).json( {message: "Booked reservation successfully!"} );
    } catch (error) {
        console.error(error.message);

        // if one db operation fails
        // rollback everything
        if(transaction) {
            transaction.rollback();
        }
        

        res.status(500).json( {message: "Error creating reservation"} );

    }
}


//gets all reservation with the asociated user
const getMyReservations = async (req,res) => {
    let transaction;
    try {
        // EXTRACT ALL DATA
        const userId = req.user.id;

        // start transaction
        transaction =  await sequelize.transaction();

        // 1) get all the reservations associated with the user
        const reservations = await getMyReservationsDb(userId,transaction);

        // commit transaction
        await transaction.commit();

        res.status(200).json({message: "Fetched reservations associated with the user", reservations});
    } catch (error) {
        console.error("Error getting user's reservations:", error);

        // if one of dp operations fail, rollaback
        if (transaction) {
            await transaction.rollback();
        }
        res.status(500).json( {message: "Error fetching reservations"} );
        
    }
}


// get reservationby its id
const getReservationById = async (req,res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA
        const { reservationId } = req.params;

        // start transaction
        transaction = await sequelize.transaction();

        // 1) get reservation from db
        const reservation = await getReservationByIdDb(reservationId, transaction);

        // commit transaction
        await transaction.commit();

        res.status(200).json({ reservation });
        
    } catch (error) {
        console.error(error.message);

        // if one of dp operations fail, rollaback
        if (transaction) {
            await transaction.rollback();
        }

        res.status(500).json( {message: "Error fetching reservation"} );
    }
}


// deletes a reservation record
const deleteReservation = async (req,res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA
        const { reservationId } = req.params;
        
        // start transaction
        transaction = await sequelize.transaction();

        // 1) delete reservation
        await deleteReservationDb(reservationId, transaction);

        // commit transaction
        await transaction.commit();
        
        res.status(200).json({message: "Reservation has been deleted"});
    } catch (error) {
        console.error("Error deleting reservation from db");

        // if one of dp operations fail, rollaback
        if (transaction) {
            await transaction.rollback();
        }

        res.status(500).json({message: "Error deleting reservation"});
    }
}

// creates a reservation entry through direct form submission
// returns HTML for browser rendering
const createReservationForm = async (req, res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA
        const { listingId, startDate, endDate, totalPrice, token, returnUrl } = req.body;
        
        // Validate token
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        } catch (tokenError) {
            return res.send(generateResponseHtml('Authentication Failed', 
                'Your session has expired or is invalid. Please log in again.', 
                returnUrl, 'error'));
        }
        
        // Prepare reservation data
        const reservationData = { 
            userId, 
            listingId, 
            startDate, 
            endDate, 
            totalPrice: parseFloat(totalPrice) 
        };

        // start transaction
        transaction = await sequelize.transaction();

        // 1) create the reservation in db
        await addReservationDb(reservationData, transaction);

        // 2) commit transaction
        await transaction.commit();

        // Return success HTML
        return res.send(generateResponseHtml('Reservation Created Successfully', 
            'Your reservation has been confirmed! You will be redirected to your reservations page.', 
            returnUrl, 'success'));

    } catch (error) {
        console.error("Error creating reservation:", error.message);

        // if one db operation fails, rollback everything
        if(transaction) {
            await transaction.rollback();
        }
        
        // Return error HTML
        return res.send(generateResponseHtml('Reservation Failed', 
            `Error creating reservation: ${error.message}`, 
            req.body.returnUrl || '/', 'error'));
    }
};

// Helper function to generate HTML response
const generateResponseHtml = (title, message, returnUrl, status) => {
    const backgroundColor = status === 'success' ? '#d1fae5' : '#fee2e2';
    const textColor = status === 'success' ? '#047857' : '#b91c1c';
    const iconSvg = status === 'success' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f3f4f6;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background-color: ${backgroundColor};
                color: ${textColor};
                border-radius: 8px;
                padding: 32px;
                width: 100%;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 24px;
                margin-bottom: 16px;
            }
            p {
                margin-bottom: 24px;
                line-height: 1.5;
            }
            .button {
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
            }
            .button:hover {
                background-color: #2563eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            ${iconSvg}
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="${returnUrl}" class="button">Go to My Reservations</a>
        </div>
        <script>
            // Auto redirect after 3 seconds
            setTimeout(() => {
                window.location.href = "${returnUrl}";
            }, 3000);
        </script>
    </body>
    </html>
    `;
};

// Export all models plus the sequelize instance and helper functions
module.exports = {
    // add operations
    addReservation, createReservationForm,
    // get operations
    getMyReservations, getReservationById,
    // delete operations
    deleteReservation,
};