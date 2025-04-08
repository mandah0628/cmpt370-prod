const { Reservation } = require('../model/index');


/**
 * Creates a reservation entry in the reservations table
 * @param {Object} reservationData The reservation data object with matching key names
 * @param {*} transaction The transaction instance
 */
const addReservationDb = async (reservationData, transaction) => {
    try {
        await Reservation.create( 
            reservationData,
            {
                transaction
            }
        );
    } catch (error) {
        console.error("Error creating reservation in db", error);
        throw new Error(error.message);
    }
}



/**
 * Fetches all reservations associated with the user
 * @param {null} userId The user id
 * @param {Object} transaction The transaction instance
 * 
 * @returns Promise that resolves into an an array of all found records.
 * Resloves into an empty array if no record is found
 */
const getMyReservationsDb = async (userId, transaction) => {
    try {
        const reservations = await Reservation.findAll(
            {
                where:  { userId },
                transaction
            },
        );

        return reservations.length > 0 ? reservations.map((reservation) => reservation.toJSON()) : [];
    } catch (error) {
        console.error("Error fetching reservations from db", error);
        throw new Error(error.message);
    }
}


/**
 * 
 * @param {number} reservationId The reservation id
 * @param {Object} transaction The transaction instance
 * @returns Promise resolves into a Reservation object if record is found.
 * If record is not found, resolves into null
 */
const getReservationByIdDb = async (reservationId, transaction) => {
    try {
        const reservation = await Reservation.findByPk(
            reservationId,
            {transaction}
        );
        return reservation ? reservation.toJSON() : null;

    } catch (error) {
        console.error("Error getting reservation from db", error);
        throw new Error(error.message);
        
    }
}


/**
 * Deletes a reservation record from the db
 * @param {number} reservationId The reservation id 
 * @param {Object} transaction The transaction instance
 */
const deleteReservationDb = async (reservationId, transaction) => {
    try {
        await Reservation.destroy(
            {where : {id: reservationId} },
            {transaction}
        );
    } catch (error) {
        console.error("Error deleting reservation from db", error);
        throw new Error(error.message);
    }
}




module.exports = {
    // create operations
    addReservationDb,
    // get operations 
    getMyReservationsDb, getReservationByIdDb,
    // delete opearations
    deleteReservationDb,
};
