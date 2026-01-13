package com.java.web_travel.repository;

import com.java.web_travel.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @Query(value = "SELECT * FROM hotels h " +
            "WHERE LOWER(REPLACE(h.address, ' ', '')) " +
            "LIKE CONCAT('%', LOWER(REPLACE(:destination, ' ', '')), '%')",
            nativeQuery = true)
    List<Hotel> findByDestination(@Param("destination") String destination);
}
