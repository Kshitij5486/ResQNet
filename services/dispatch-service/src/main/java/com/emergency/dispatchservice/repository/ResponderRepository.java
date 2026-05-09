package com.emergency.dispatchservice.repository;

import com.emergency.dispatchservice.entity.Responder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResponderRepository extends JpaRepository<Responder, UUID> {

    @Query(value = "SELECT * FROM dispatch.responders WHERE city = :city AND status = 'AVAILABLE'", nativeQuery = true)
    List<Responder> findAvailableByCity(String city);

    @Query(value = "SELECT * FROM dispatch.responders WHERE city = :city AND status = :status", nativeQuery = true)
    List<Responder> findByCityAndStatus(String city, String status);

    @Modifying
    @Query(value = "UPDATE dispatch.responders SET status = CAST(:status AS dispatch.responder_status), current_incident_id = :incidentId WHERE id = CAST(:id AS uuid)", nativeQuery = true)
    void updateStatusAndIncident(String id, String status, UUID incidentId);

    @Modifying
    @Query(value = "UPDATE dispatch.responders SET latitude = :latitude, longitude = :longitude, last_ping_at = :pingAt WHERE id = CAST(:id AS uuid)", nativeQuery = true)
    void updateLocation(String id, double latitude, double longitude, Instant pingAt);
}